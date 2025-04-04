import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import Supabase client
import IntegrationSuggestions from './IntegrationSuggestions'; // Import our new component

// Define Action interface (can be expanded later)
interface Action {
  type: 'goto' | 'fill' | 'click' | string; // Allow other types
  url?: string;
  selector?: string;
  value?: string;
  timestamp?: string; // Add timestamp for when the action was recorded
}

// Define an interface for the Chunk data structure
interface Chunk {
    id: string;
    order: number;
    startTime: string;
    endTime: string;
    name: string;
    action?: Action; // Make action optional initially
    visualData?: {
        previewAvailable: boolean;
        previewUrl: string | null;
        thumbnailColor: string;
    };
}

// Helper function to extract Loom video ID from various URL formats
const getLoomVideoId = (url: string): string | null => {
    try {
        const parsedUrl = new URL(url);
        // Handle share URLs like https://www.loom.com/share/...
        if (parsedUrl.pathname.startsWith('/share/')) {
            return parsedUrl.pathname.split('/')[2];
        }
        // Handle embed URLs like https://www.loom.com/embed/...
        if (parsedUrl.pathname.startsWith('/embed/')) {
            return parsedUrl.pathname.split('/')[2];
        }
        // Handle direct video URLs like https://www.loom.com/v/...
        if (parsedUrl.pathname.startsWith('/v/')) {
            return parsedUrl.pathname.split('/')[2];
        }
        // Handle edit URLs like https://www.loom.com/edit/...
        if (parsedUrl.pathname.startsWith('/edit/')) {
            return parsedUrl.pathname.split('/')[2];
        }
    } catch (error) {
        console.error("Error parsing Loom URL:", error);
        // Fallback for potentially simpler formats or non-URL strings
        const parts = url.split('/');
        const potentialId = parts[parts.length - 1];
        // Basic check if it looks like a Loom ID (alphanumeric)
        if (potentialId && /^[a-zA-Z0-9]+$/.test(potentialId) && potentialId.length > 10) {
            return potentialId;
        }
    }
    return null;
};

function DisplayPage() {
    const [searchParams] = useSearchParams();
    const loomUrl = searchParams.get('url');
    const videoId = loomUrl ? getLoomVideoId(loomUrl) : null;
    const embedUrl = videoId ? `https://www.loom.com/embed/${videoId}` : null;

    // State for chunks and loading/error status
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [integrationData, setIntegrationData] = useState(null); // Add state for integration data
    const [actionStatus, setActionStatus] = useState<Record<string, { 
        loading: boolean; 
        message: string; 
        success: boolean | null;
        screenshot?: string; // Base64 encoded screenshot
    }>>({});
    const [recordingChunkId, setRecordingChunkId] = useState<string | null>(null); // State for recording mode
    const [recordedActions, setRecordedActions] = useState<Record<string, Action[]>>({}); // Stores recorded actions by chunkId
    const [isRecording, setIsRecording] = useState(false); // Whether currently recording
    const [isSaving, setIsSaving] = useState(false); // State for save button
    const [saveMessage, setSaveMessage] = useState<string | null>(null); // State for save status
    const [recordingCleanup, setRecordingCleanup] = useState<(() => void) | null>(null); // State for recording cleanup

    // useEffect hook to call the analysis API when the component mounts
    useEffect(() => {
        if (loomUrl) {
            setIsLoading(true);
            setError(null);
            
            // Function to make API call with retry logic
            const fetchAnalysis = async (retryCount = 0, maxRetries = 3) => {
                try {
                    console.log(`Attempting to analyze Loom URL (attempt ${retryCount + 1}): ${loomUrl}`);
                    
                    const response = await fetch('http://localhost:3001/api/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ loomUrl }),
                    });
                    
                    // Read the response body as text first to help with debugging
                    const responseText = await response.text();
                    
                    // Try to parse as JSON
                    let data;
                    try {
                        data = JSON.parse(responseText);
                    } catch (e) {
                        console.error("Failed to parse response as JSON:", responseText);
                        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}...`);
                    }
                    
                    if (!response.ok) {
                        // Structured error from server
                        const errorMsg = data.error || `HTTP error! status: ${response.status}`;
                        const errorDetails = data.details ? `\nDetails: ${data.details}` : '';
                        throw new Error(`${errorMsg}${errorDetails}`);
                    }
                    
                    if (data.chunks) {
                        console.log(`Successfully retrieved ${data.chunks.length} chunks`);
                        setChunks(data.chunks);
                        
                        // Set integration data if available
                        if (data.integrations) {
                            console.log('Received integration suggestions:', data.integrations);
                            setIntegrationData(data.integrations);
                        }
                    } else {
                        throw new Error('Invalid data structure received from server: missing chunks array');
                    }
                } catch (err: any) {
                    console.error("Error fetching chunks:", err);
                    
                    // Network errors often need retries
                    const isNetworkError = err.message.includes('fetch') || 
                                          err.message.includes('network') ||
                                          err.message.includes('ECONNREFUSED');
                    
                    // If we haven't tried too many times and it's a retriable error, retry
                    if (retryCount < maxRetries && isNetworkError) {
                        const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                        console.log(`Retrying in ${backoffTime}ms...`);
                        
                        setTimeout(() => {
                            fetchAnalysis(retryCount + 1, maxRetries);
                        }, backoffTime);
                        return;
                    }
                    
                    // Otherwise, show the error
                    setError(err.message || 'Failed to analyze Loom video. Please try again.');
                    setIsLoading(false);
                }
            };
            
            fetchAnalysis()
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [loomUrl]);

    // Function to handle executing an action for a chunk
    const handleExecuteAction = async (chunkId: string, action: Action | undefined) => {
        if (!action) {
            setActionStatus(prev => ({ ...prev, [chunkId]: { loading: false, message: 'No action defined for this chunk.', success: false } }));
            return;
        }

        setActionStatus(prev => ({ ...prev, [chunkId]: { loading: true, message: 'Executing...', success: null } }));

        try {
            // Set options for execution
            const executionOptions = {
                headless: false, // Show browser for visibility
                stopOnError: true, // Stop on first error
            };

            const response = await fetch('http://localhost:3001/api/execute_action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action, // For backward compatibility
                    actions: [action], // As an array for new API
                    ...executionOptions
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                let errMessage;
                try {
                    const errJson = JSON.parse(errText);
                    errMessage = errJson.error || `Action execution failed with status: ${response.status}`;
                } catch (e) {
                    errMessage = `Action execution failed with status: ${response.status}: ${errText}`;
                }
                throw new Error(errMessage);
            }

            const result = await response.json();

            if (!result.success) {
                // Get detailed error message from results if available
                const failedAction = result.results?.find((r: any) => !r.success);
                throw new Error(failedAction?.error || result.error || `Action execution failed`);
            }

            // Display success message with more details if available
            const successMsg = result.results?.length > 0 
                ? `${result.results[0].message || 'Action executed successfully!'}`
                : 'Action executed successfully!';
            
            setActionStatus(prev => ({ ...prev, [chunkId]: { 
                loading: false, 
                message: successMsg, 
                success: true,
                // Store screenshot if available
                screenshot: result.results?.[0]?.screenshot || result.finalScreenshot
            }}));

        } catch (err: any) {
            console.error("Failed to execute action:", err);
            setActionStatus(prev => ({ ...prev, [chunkId]: { 
                loading: false, 
                message: err.message || 'Failed to execute action.', 
                success: false
            }}));
        }
    };

    // --- Add Handlers for Take Control / Recording ---
    const handleTakeControl = (chunkId: string) => {
        console.log(`Taking control for chunk: ${chunkId}`);
        setRecordingChunkId(chunkId); // Set the currently recording chunk
        setIsRecording(true);
        
        // Initialize the recorded actions array for this chunk if it doesn't exist
        if (!recordedActions[chunkId]) {
            setRecordedActions(prev => ({
                ...prev,
                [chunkId]: []
            }));
        }
        
        // Start recording actions
        setTimeout(() => {
            startRecordingUserActions(chunkId);
        }, 500);
    };

    // Function to start recording user actions
    const startRecordingUserActions = (chunkId: string) => {
        console.log('Starting to record user actions...');
        
        // Create a new array to store recorded actions
        const actions: Action[] = [];
        
        // Record action helper function
        const recordAction = (action: Action) => {
            const actionWithTimestamp = {
                ...action,
                timestamp: new Date().toISOString()
            };
            
            actions.push(actionWithTimestamp);
            
            // Update state with the new action
            setRecordedActions(prev => ({
                ...prev,
                [chunkId]: [...(prev[chunkId] || []), actionWithTimestamp]
            }));
            
            console.log('Recorded action:', actionWithTimestamp);
        };
        
        // Set up the recording event listeners
        const setupRecordingListeners = () => {
            // Handler for click events
            const handleClick = (event: MouseEvent) => {
                if (!isRecording) return;
                
                // Get the target element
                const target = event.target as HTMLElement;
                if (!target) return;
                
                // Try to get a good selector for the element
                let selector = '';
                
                // Try to use ID if available
                if (target.id) {
                    selector = `#${target.id}`;
                } 
                // Try to use class if available
                else if (target.className && typeof target.className === 'string') {
                    const classes = target.className.split(' ').filter(c => c).join('.');
                    if (classes) selector = `.${classes}`;
                } 
                // Use tag name and position as last resort
                else {
                    const tagName = target.tagName.toLowerCase();
                    selector = tagName;
                    
                    // Add nth-child if parent has multiple same-tag children
                    const parent = target.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children);
                        const sameTagSiblings = siblings.filter(el => el.tagName.toLowerCase() === tagName);
                        if (sameTagSiblings.length > 1) {
                            const index = siblings.indexOf(target) + 1;
                            selector = `${tagName}:nth-child(${index})`;
                        }
                    }
                }
                
                // Create a click action
                recordAction({
                    type: 'click',
                    selector: selector,
                    value: target.textContent?.trim() || ''
                });
            };
            
            // Handler for input events
            const handleInput = (event: Event) => {
                if (!isRecording) return;
                
                const target = event.target as HTMLInputElement;
                if (!target) return;
                
                // Skip if not an input/textarea/select
                if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
                
                // Get a selector for the input
                let selector = '';
                if (target.id) {
                    selector = `#${target.id}`;
                } else if (target.name) {
                    selector = `${target.tagName.toLowerCase()}[name="${target.name}"]`;
                } else if (target.className && typeof target.className === 'string') {
                    const classes = target.className.split(' ').filter(c => c).join('.');
                    if (classes) selector = `.${classes}`;
                } else {
                    selector = target.tagName.toLowerCase();
                }
                
                // Create a fill action
                recordAction({
                    type: 'fill',
                    selector: selector,
                    value: target.value
                });
            };
            
            // Add event listeners
            document.addEventListener('click', handleClick);
            document.addEventListener('change', handleInput);
            
            // Create a cleanup function
            return () => {
                document.removeEventListener('click', handleClick);
                document.removeEventListener('change', handleInput);
            };
        };
        
        // Call the setup function and store cleanup function
        const cleanup = setupRecordingListeners();
        
        // Store cleanup function for later use
        setRecordingCleanup(() => cleanup);
    };

    const handleSaveRecording = async (chunkId: string) => {
        console.log(`Saving recording for chunk: ${chunkId}`);
        setIsRecording(false);
        
        // Clean up recording listeners if they exist
        if (recordingCleanup) {
            recordingCleanup();
            setRecordingCleanup(null);
        }
        
        // If no actions were recorded, create a sample one for demo purposes
        if (!recordedActions[chunkId] || recordedActions[chunkId].length === 0) {
            // Create a sample recorded action for demonstration
            const sampleAction: Action = {
                type: 'goto',
                url: 'https://example.com',
                timestamp: new Date().toISOString()
            };
            
            setRecordedActions(prev => ({
                ...prev,
                [chunkId]: [sampleAction]
            }));
        }
        
        // Get the recorded actions for this chunk
        const actions = recordedActions[chunkId] || [];
        console.log(`Saving ${actions.length} recorded actions for chunk ${chunkId}`);
        
        // Set status to loading
        setActionStatus(prev => ({ 
            ...prev, 
            [chunkId]: { 
                loading: true, 
                message: 'Saving recorded actions...', 
                success: null 
            } 
        }));
        
        try {
            // Send recorded actions to the server
            const response = await fetch('http://localhost:3001/api/record_actions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    chunkId, 
                    actions,
                    loomUrl, // Send the Loom URL for context
                    validate: true // Request validation of the actions
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to save recorded actions');
            }
            
            // Update the chunk with the new actions
            setChunks(prev => prev.map(chunk => 
                chunk.id === chunkId 
                    ? { ...chunk, action: result.processedActions[0] || chunk.action } 
                    : chunk
            ));
            
            // Update action status with success
            setActionStatus(prev => ({ 
                ...prev, 
                [chunkId]: { 
                    loading: false, 
                    message: `${actions.length} actions recorded and saved successfully.`, 
                    success: true 
                } 
            }));
            
        } catch (err: any) {
            console.error("Failed to save recorded actions:", err);
            setActionStatus(prev => ({ 
                ...prev, 
                [chunkId]: { 
                    loading: false, 
                    message: err.message || 'Failed to save recorded actions.', 
                    success: false 
                } 
            }));
        } finally {
            // Exit recording mode
            setRecordingChunkId(null);
        }
    };
    // --- End Handlers for Take Control / Recording ---

    // --- Add Handler for Save Agent ---
    const handleSaveAgent = async () => {
        // Check for active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            setSaveMessage('⚠️ You must be logged in to save agents. Please sign in first.');
            
            // Add a delay and then show a more detailed message
            setTimeout(() => {
                setSaveMessage('⚠️ You must be logged in to save agents. Please sign in first.\n\n' +
                               'During development: You can test saving with the API endpoint directly.');
            }, 2000);
            return;
        }

        const agentName = window.prompt('Please enter a name for this agent:');
        if (!agentName) {
            setSaveMessage('Agent save cancelled.');
            return;
        }

        setSaveMessage(null);
        setIsSaving(true);

        try {
            // Get user from the current session
            const user = session.user;

            if (!loomUrl) {
                throw new Error('Loom URL is missing.');
            }

            console.log("Saving agent to Supabase:", { name: agentName, userId: user.id, loomUrl });
            
            // Server API approach - handles RLS policies automatically
            console.log("Using server API for agent saving");
            const response = await fetch('http://localhost:3001/api/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: agentName,
                    loomUrl,
                    userId: user.id,
                    chunkData: chunks
                }),
            });

            const result = await response.json();
            
            // Check if we got RLS fix instructions
            if (result.sqlFix) {
                console.log("Received RLS fix instructions");
                
                // Display the SQL and instructions in a more readable format
                const sqlInstructions = `
                    // RLS Policy Fix Required
                    // Please run these SQL commands in the Supabase SQL Editor to fix RLS policies:
                    
                    ${result.sqlFix}
                    
                    // Steps:
                    // 1. Log in to Supabase: https://dafizawmeehypygvgdge.supabase.co
                    // 2. Go to SQL Editor
                    // 3. Create a new query
                    // 4. Paste the SQL above
                    // 5. Click "Run"
                `;
                
                // Alert the user about the RLS issue and provide SQL
                alert(
                    "Row Level Security Policy Issue Detected\n\n" +
                    "The app can't save agents to the database because of RLS policy restrictions.\n\n" +
                    "During development, your agent has been saved locally (in memory).\n\n" +
                    "SQL instructions for fixing this have been logged to the console."
                );
                
                // Log SQL to console for easy copying
                console.log(sqlInstructions);
                
                if (result.success) {
                    // Development mode storage was successful
                    setSaveMessage(`✅ Agent '${agentName}' saved in development mode only. Check console for RLS fix.`);
                } else {
                    // Development mode storage failed
                    setSaveMessage(`⚠️ Agent '${agentName}' couldn't be saved. RLS policy needs to be fixed. Check console.`);
                }
            } else if (result.note) {
                // This is a development bypass message
                setSaveMessage(`✅ Agent '${agentName}' saved (dev mode). ${result.note}`);
            } else {
                // Normal successful save
                setSaveMessage(`✅ Agent '${agentName}' saved successfully! (Agent ID: ${result.agentId})`);
            }

        } catch (err: any) {
            console.error("Failed to save agent:", err);
            setSaveMessage(`❌ Error saving agent: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    // --- End Handler ---

    if (!loomUrl) {
        return <div>Error: No Loom URL provided.</div>;
    }

    if (!videoId || !embedUrl) {
        return <div>Error: Could not extract Loom video ID from the provided URL. Please check the URL.</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>Displaying Loom Video</h2>
            <p>Original URL: {loomUrl}</p>
            <div style={{ position: 'relative', paddingBottom: '62.5%', height: 0, width: '80%', maxWidth: '800px', marginBottom: '20px' }}>
                <iframe
                    src={embedUrl}
                    frameBorder="0"
                    allowFullScreen
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }}
                    title="Loom Video"
                ></iframe>
            </div>

            <hr style={{ width: '80%', margin: '20px 0' }} />

            {/* Integration Suggestions */}
            {!isLoading && integrationData && (
                <div style={{ width: '80%', maxWidth: '800px', marginBottom: '20px' }}>
                    <h2>Integration Suggestions</h2>
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '5px', padding: '15px', backgroundColor: '#f9f9f9' }}>
                        <IntegrationSuggestions integrationData={integrationData} />
                    </div>
                </div>
            )}

            {/* Save Agent Button Area */}
             <div style={{ width: '80%', maxWidth: '800px', marginBottom: '15px', textAlign: 'right' }}>
                 <button onClick={handleSaveAgent} disabled={isLoading || isSaving || !!recordingChunkId || chunks.length === 0}>
                     {isSaving ? 'Saving...' : 'Save Agent'}
                 </button>
                 {saveMessage && <p style={{ fontSize: '0.9em', color: saveMessage.includes('Error') ? 'red' : 'green' }}>{saveMessage}</p>}
             </div>

            <h2>Video Chunks</h2>
            <div style={{ width: '80%', maxWidth: '800px', marginBottom: '15px', textAlign: 'left' }}>
                <p>
                    Video chunks represent segments of the Loom video that contain distinct actions. Each chunk has an 
                    automatically detected action that can be run individually or modified.
                </p>
            </div>
            {isLoading && <p>Analyzing video...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!isLoading && !error && (
                <ul style={{ listStyle: 'none', padding: 0, width: '80%', maxWidth: '800px' }}>
                    {chunks.length > 0 ? (
                        chunks.map(chunk => {
                            const status = actionStatus[chunk.id];
                            const isRecordingThisChunk = recordingChunkId === chunk.id;
                            return (
                                <li key={chunk.id} style={{ border: isRecordingThisChunk ? '2px solid red' : '1px solid #ccc', marginBottom: '10px', padding: '15px', textAlign: 'left' }}>
                                    <div>
                                        <strong>Chunk {chunk.order}: {chunk.name}</strong> ({chunk.startTime} - {chunk.endTime})
                                    </div>
                                    {chunk.action && !isRecordingThisChunk && (
                                        <div style={{ marginTop: '10px' }}>
                                            <pre style={{ fontSize: '0.9em', backgroundColor: '#f0f0f0', padding: '5px' }}>Action: {JSON.stringify(chunk.action)}</pre>
                                            <button
                                                onClick={() => handleExecuteAction(chunk.id, chunk.action)}
                                                disabled={status?.loading || !!recordingChunkId}
                                                style={{ marginTop: '5px', padding: '5px 10px', marginRight: '10px' }}
                                            >
                                                {status?.loading ? 'Running...' : 'Run Action'}
                                            </button>
                                            <button 
                                                onClick={() => handleTakeControl(chunk.id)}
                                                disabled={!!recordingChunkId}
                                                style={{ padding: '5px 10px' }}
                                            >
                                                Take Control
                                            </button>
                                            {status && (
                                                <div>
                                                    <span style={{
                                                        marginLeft: '10px',
                                                        color: status.success === true ? 'green' : status.success === false ? 'red' : 'black',
                                                        fontSize: '0.9em'
                                                    }}>
                                                        {status.message}
                                                    </span>
                                                    
                                                    {/* Display screenshot if available */}
                                                    {status.screenshot && (
                                                        <div style={{ marginTop: '10px' }}>
                                                            <h4>Action Result</h4>
                                                            <img 
                                                                src={`data:image/png;base64,${status.screenshot}`} 
                                                                alt="Action result" 
                                                                style={{ maxWidth: '100%', border: '1px solid #ccc' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {isRecordingThisChunk && (
                                        <div style={{ marginTop: '10px', padding: '10px', border: '1px dashed red', backgroundColor: '#fff0f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'red', fontWeight: 'bold' }}>🔴 Recording user actions...</span>
                                                <div>
                                                    <button 
                                                        onClick={() => {
                                                            // Ask user for a URL to navigate to
                                                            const url = window.prompt('Enter a URL to navigate to:', 'https://example.com');
                                                            if (!url) return;
                                                            
                                                            // Create a goto action
                                                            const navigationAction: Action = {
                                                                type: 'goto',
                                                                url,
                                                                timestamp: new Date().toISOString()
                                                            };
                                                            
                                                            // Add to recorded actions
                                                            setRecordedActions(prev => ({
                                                                ...prev,
                                                                [chunk.id]: [...(prev[chunk.id] || []), navigationAction]
                                                            }));
                                                        }}
                                                        style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#ff9999', border: '1px solid #ff6666' }}
                                                    >
                                                        Add Navigation
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            // Clean up recording listeners if they exist
                                                            if (recordingCleanup) {
                                                                recordingCleanup();
                                                                setRecordingCleanup(null);
                                                            }
                                                            // Clear recording state
                                                            setIsRecording(false);
                                                            setRecordingChunkId(null);
                                                            
                                                            // Remove recorded actions for this chunk
                                                            setRecordedActions(prev => {
                                                                const newState = {...prev};
                                                                delete newState[chunk.id];
                                                                return newState;
                                                            });
                                                        }}
                                                        style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSaveRecording(chunk.id)}
                                                        style={{ padding: '5px 10px' }}
                                                    >
                                                        Save Recording
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Display recorded actions */}
                                            {recordedActions[chunk.id] && recordedActions[chunk.id].length > 0 && (
                                                <div style={{ marginTop: '10px' }}>
                                                    <h4 style={{ margin: '0 0 5px 0' }}>Recorded Actions:</h4>
                                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9em' }}>
                                                        {recordedActions[chunk.id].map((action, index) => (
                                                            <li key={`${chunk.id}-action-${index}`}>
                                                                {action.type === 'goto' 
                                                                    ? `Navigate to: ${action.url}` 
                                                                    : action.type === 'click' 
                                                                        ? `Click on: ${action.selector}` 
                                                                        : action.type === 'fill' 
                                                                            ? `Fill "${action.value}" in ${action.selector}` 
                                                                            : `${action.type} action`
                                                                }
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#666' }}>
                                                <p style={{ margin: '0 0 5px 0' }}>
                                                    In a real implementation, user actions like clicks, typing, and navigation would be automatically recorded.
                                                </p>
                                                <p style={{ margin: 0 }}>
                                                    Use "Add Navigation" to add a new navigation action or "Save Recording" when finished.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ 
                                        backgroundColor: '#f5f5f5', 
                                        marginTop: '10px', 
                                        padding: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '5px' }}>
                                                    Chunk Preview: {chunk.startTime} - {chunk.endTime}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input 
                                                        type="range" 
                                                        min="0" 
                                                        max="100" 
                                                        defaultValue="0"
                                                        style={{ width: '150px', marginRight: '10px' }}
                                                        aria-label="Scrub through chunk"
                                                    />
                                                    <button style={{ padding: '2px 8px', fontSize: '0.8em' }}>
                                                        <span role="img" aria-label="Play">▶️</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ 
                                                width: '160px', 
                                                height: '90px', 
                                                backgroundColor: chunk.visualData?.thumbnailColor || '#e0e0e0', 
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #ccc',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                {chunk.visualData?.previewUrl ? (
                                                    <img 
                                                        src={chunk.visualData.previewUrl}
                                                        alt={`Preview of ${chunk.name}`}
                                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                                    />
                                                ) : (
                                                    <div style={{ 
                                                        textAlign: 'center', 
                                                        fontSize: '0.8em',
                                                        padding: '10px'
                                                    }}>
                                                        <div style={{ marginBottom: '5px' }}>
                                                            <span role="img" aria-label="Video">🎬</span> {chunk.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                                                            ({chunk.startTime} - {chunk.endTime})
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <p>No chunks generated yet.</p>
                    )}
                </ul>
            )}

            {/* MicroVideoPlayer Component - this would be moved to a separate file in a production app */}
            <div style={{ padding: '20px', backgroundColor: '#f7f7f7', borderRadius: '5px', marginTop: '20px', width: '80%', maxWidth: '800px' }}>
                <h3>About Micro-Video Players</h3>
                <p>
                    In a full implementation, each chunk would have a micro-video player that allows you to:
                </p>
                <ul>
                    <li><strong>Preview the chunk</strong> - See a visual preview of what happens in that part of the video</li>
                    <li><strong>Scrub through the chunk</strong> - Navigate within the specific time range of the chunk</li>
                    <li><strong>Set precise start/end times</strong> - Adjust the chunk boundaries</li>
                </ul>
                <p>
                    The current implementation uses timestamps and basic chunking to demonstrate the concept.
                </p>
            </div>
        </div>
    );
}

export default DisplayPage;