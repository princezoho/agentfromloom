import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Interface for Agent data received from API
interface Agent {
    id: string;
    name: string;
    description?: string;
    loom_url: string;
    created_at: string;
    // Add other fields as needed
}

function AgentDashboard() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Get user ID on component mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            } else {
                setError('You must be logged in to view agents.');
            }
        };
        getUser();
    }, []);

    // Fetch agents when user ID is available
    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            setError(null);

            fetch(`http://localhost:3001/api/agents?userId=${encodeURIComponent(userId)}`) // Pass userId as query param
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
    }, [userId]); // Run when userId changes

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