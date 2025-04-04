import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom'; // No longer needed here
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js'; // Import Session type

// Interface for Agent data received from API
interface Agent {
    id: string;
    name: string;
    description?: string;
    loom_url: string;
    created_at: string;
    // Add other fields as needed
}

// Define props interface for the component
interface AgentDashboardProps {
    session: Session; // Expect session as a prop
}

function AgentDashboard({ session }: AgentDashboardProps) { // Destructure session from props
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [userId, setUserId] = useState<string | null>(null); // No longer need separate userId state
    const userId = session.user.id; // Get userId directly from session prop

    // Fetch agents when component mounts (userId is guaranteed from session prop)
    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            setError(null);

            fetch(`http://localhost:3001/api/agents?userId=${encodeURIComponent(userId)}`) 
                .then(response => {
                    if (!response.ok) {
                         return response.json().then(errData => {
                            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
                         }).catch(() => {
                            throw new Error(`HTTP error! status: ${response.status}`);
                         });
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success && data.agents) {
                        setAgents(data.agents);
                    } else {
                        throw new Error(data.error || 'Failed to parse agent data.');
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch agents:", err);
                    setError(err.message || 'Failed to load agents.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    // No longer need separate useEffect for getUser, userId comes from props
    // }, [userId]); // Change dependency array if needed, maybe just run once?
    }, []); // Run once on mount since session/userId prop is stable for this instance

    return (
        <div>
            <h2>My Agents</h2>

            {isLoading && <p>Loading agents...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {!isLoading && !error && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {agents.length > 0 ? (
                        agents.map(agent => (
                            <li key={agent.id} style={{ border: '1px solid #eee', marginBottom: '15px', padding: '15px' }}>
                                <h3>{agent.name}</h3>
                                {agent.description && <p>{agent.description}</p>}
                                <p><small>Loom URL: {agent.loom_url}</small></p>
                                <p><small>Created: {new Date(agent.created_at).toLocaleString()}</small></p>
                                {/* Add buttons for Run, Edit, Delete later */}
                                <button disabled style={{ marginRight: '10px' }}>Run Agent (NYI)</button>
                                <button disabled>Edit Chunks (NYI)</button>
                            </li>
                        ))
                    ) : (
                        <p>You haven't saved any agents yet.</p>
                    )}
                </ul>
            )}
        </div>
    );
}

export default AgentDashboard; 