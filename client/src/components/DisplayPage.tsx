import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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
    const [actionStatus, setActionStatus] = useState<Record<string, { loading: boolean; message: string; success: boolean | null }>>({});

    // useEffect hook to call the analysis API when the component mounts
    useEffect(() => {
        if (loomUrl) {
            setIsLoading(true);
            setError(null);
            fetch('http://localhost:3001/api/analyze', { // Call the backend API
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loomUrl }),
            })
            .then(response => {
                if (!response.ok) {
                    // Try to parse error message from backend if available
                    return response.json().then(errData => {
                        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
                    }).catch(() => {
                        // Fallback if no JSON error body
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.chunks) {
                    setChunks(data.chunks);
                } else {
                    throw new Error('Invalid data structure received from server');
                }
            })
            .catch(err => {
                console.error("Failed to fetch chunks:", err);
                setError(err.message || 'Failed to analyze Loom video. Please try again.');
            })
            .finally(() => {
                setIsLoading(false);
            });
        }
    }, [loomUrl]); // Dependency array ensures this runs when loomUrl changes

    // Function to handle executing an action for a chunk
    const handleExecuteAction = async (chunkId: string, action: Action | undefined) => {
        if (!action) {
            setActionStatus(prev => ({ ...prev, [chunkId]: { loading: false, message: 'No action defined for this chunk.', success: false } }));
            return;
        }

        setActionStatus(prev => ({ ...prev, [chunkId]: { loading: true, message: 'Executing...', success: null } }));

        try {
            const response = await fetch('http://localhost:3001/api/execute_action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Action execution failed with status: ${response.status}`);
            }

            setActionStatus(prev => ({ ...prev, [chunkId]: { loading: false, message: result.message || 'Action executed successfully!', success: true } }));

        } catch (err: any) {
             console.error("Failed to execute action:", err);
             setActionStatus(prev => ({ ...prev, [chunkId]: { loading: false, message: err.message || 'Failed to execute action.', success: false } }));
        }
    };

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

            <h2>Video Chunks</h2>
            {isLoading && <p>Analyzing video...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!isLoading && !error && (
                <ul style={{ listStyle: 'none', padding: 0, width: '80%', maxWidth: '800px' }}>
                    {chunks.length > 0 ? (
                        chunks.map(chunk => {
                            const status = actionStatus[chunk.id];
                            return (
                                <li key={chunk.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '15px', textAlign: 'left' }}>
                                    <div>
                                        <strong>Chunk {chunk.order}: {chunk.name}</strong> ({chunk.startTime} - {chunk.endTime})
                                    </div>
                                    {chunk.action && (
                                        <div style={{ marginTop: '10px' }}>
                                            <pre style={{ fontSize: '0.9em', backgroundColor: '#f0f0f0', padding: '5px' }}>Action: {JSON.stringify(chunk.action)}</pre>
                                            <button
                                                onClick={() => handleExecuteAction(chunk.id, chunk.action)}
                                                disabled={status?.loading}
                                                style={{ marginTop: '5px', padding: '5px 10px' }}
                                            >
                                                {status?.loading ? 'Running...' : 'Run Action'}
                                            </button>
                                            {status && (
                                                <span style={{
                                                    marginLeft: '10px',
                                                    color: status.success === true ? 'green' : status.success === false ? 'red' : 'black',
                                                    fontSize: '0.9em'
                                                 }}>
                                                     {status.message}
                                                 </span>
                                             )}
                                        </div>
                                    )}
                                    {/* Placeholder for micro-video preview */}
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