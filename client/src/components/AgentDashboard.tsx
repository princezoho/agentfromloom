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

    // Fetch agents directly from Supabase when component mounts
    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            setError(null);

            // Use Supabase directly instead of the API endpoint
            const fetchAgents = async () => {
                try {
                    const { data, error } = await supabase
                        .from('Agents')
                        .select('id, name, description, loom_url, created_at')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                        
                    if (error) {
                        console.error("Supabase error fetching agents:", error);
                        throw new Error(error.message || "Failed to load agents");
                    }
                    
                    setAgents(data || []);
                } catch (err: any) {
                    console.error("Failed to fetch agents:", err);
                    setError(err.message || 'Failed to load agents.');
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchAgents();
        }
    }, [userId]); // Include userId in dependency array

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