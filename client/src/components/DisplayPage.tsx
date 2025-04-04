import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import Supabase client

// Define Action interface (can be expanded later)
interface Action {
  type: 'goto' | 'fill' | 'click' | string; // Allow other types
  url?: string;
  selector?: string;
  value?: string;
}

// Define an interface for the Chunk data structure
interface Chunk {
    id: string;
    order: number;
    startTime: string;
    endTime: string;
    name: string;
    action?: Action; // Make action optional initially
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
    const [actionStatus, setActionStatus] = useState<Record<string, { 
        loading: boolean; 
        message: string; 
        success: boolean | null;
        screenshot?: string; // Base64 encoded screenshot
    }>>({});
    const [recordingChunkId, setRecordingChunkId] = useState<string | null>(null); // State for recording mode
    const [isSaving, setIsSaving] = useState(false); // State for save button
    const [saveMessage, setSaveMessage] = useState<string | null>(null); // State for save status

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

    // --- Add Handlers for Take Control / Save Recording ---
    const handleTakeControl = (chunkId: string) => {
        console.log(`Taking control for chunk: ${chunkId}`);
        setRecordingChunkId(chunkId); // Set the currently recording chunk
        // In a real implementation, this would pause AI execution for this chunk
        // and start listening for user events.
    };

    const handleSaveRecording = (chunkId: string) => {
        console.log(`Saving recording for chunk: ${chunkId}`);
        setRecordingChunkId(null); // Exit recording mode
        // In a real implementation, this would stop event listeners,
        // process the recorded actions, and potentially save them.
        // For now, we just exit the recording state.
        setActionStatus(prev => ({ ...prev, [chunkId]: { loading: false, message: 'Manual recording saved (simulated).', success: true } }));
    };

    // --- Add Handler for Save Agent ---
    const handleSaveAgent = async () => {
        const agentName = window.prompt('Please enter a name for this agent:');
        if (!agentName) {
            setSaveMessage('Agent save cancelled.');
            return;
        }

        setSaveMessage(null);
        setIsSaving(true);

        try {
            // Get user session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error(userError?.message || 'You must be logged in to save agents.');
            }

            if (!loomUrl) {
                throw new Error('Loom URL is missing.');
            }

            // Prepare data for backend
            const agentData = {
                name: agentName,
                loomUrl: loomUrl,
                userId: user.id, // Include user ID
                chunkData: chunks // Send the current chunks
            };

            const response = await fetch('http://localhost:3001/api/agents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                     // Include auth token if backend validation is added later
                     // 'Authorization': `Bearer ${session.access_token}` 
                },
                body: JSON.stringify(agentData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Failed to save agent with status: ${response.status}`);
            }

            setSaveMessage(`Agent '${agentName}' saved successfully! (Agent ID: ${result.agentId})`);

        } catch (err: any) {
            console.error("Failed to save agent:", err);
            setSaveMessage(`Error saving agent: ${err.message}`);
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

            {/* Save Agent Button Area */}
             <div style={{ width: '80%', maxWidth: '800px', marginBottom: '15px', textAlign: 'right' }}>
                 <button onClick={handleSaveAgent} disabled={isLoading || isSaving || !!recordingChunkId || chunks.length === 0}>
                     {isSaving ? 'Saving...' : 'Save Agent'}
                 </button>
                 {saveMessage && <p style={{ fontSize: '0.9em', color: saveMessage.includes('Error') ? 'red' : 'green' }}>{saveMessage}</p>}
             </div>

            <h2>Video Chunks</h2>
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
                                            <span style={{ color: 'red', fontWeight: 'bold' }}>🔴 Recording user actions...</span>
                                            <button 
                                                onClick={() => handleSaveRecording(chunk.id)}
                                                style={{ marginLeft: '15px', padding: '5px 10px' }}
                                            >
                                                Save Recording
                                            </button>
                                        </div>
                                    )}
                                    <div style={{ height: '50px', backgroundColor: '#eee', marginTop: '10px', textAlign: 'center', lineHeight: '50px', fontStyle: 'italic' }}>
                                        [Micro-video preview placeholder]
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <p>No chunks generated yet.</p>
                    )}
                </ul>
            )}
        </div>
    );
}

export default DisplayPage; 