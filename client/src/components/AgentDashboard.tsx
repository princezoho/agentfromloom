import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import GitHubExport from './GitHubExport';

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

function AgentDashboard({ session }: AgentDashboardProps) {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const userId = session.user.id;
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAgentForExport, setSelectedAgentForExport] = useState<Agent | null>(null);

    // Fetch agents directly from Supabase when component mounts
    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            setError(null);

            // Function to fetch agents
            const fetchAgents = async () => {
                console.log(`Fetching agents for user: ${userId}`);
                try {
                    // Call server API instead of direct Supabase query to avoid RLS issues
                    const response = await fetch(`http://localhost:3001/api/agents?userId=${userId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    setAgents(data.agents || []);
                } catch (err: any) {
                    console.error("Failed to fetch agents:", err);
                    setError(err.message || 'Failed to load agents.');
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchAgents();
        }
    }, [userId]);

    // Function to run an agent
    const handleRunAgent = async (agent: Agent) => {
        setSelectedAgent(agent);
        setIsRunning(true);
        
        try {
            // Navigate to the display page with the Loom URL
            navigate(`/display?url=${encodeURIComponent(agent.loom_url)}`);
        } catch (error) {
            console.error('Error running agent:', error);
            setIsRunning(false);
        }
    };

    // Function to open edit dialog
    const handleEditAgent = (agent: Agent) => {
        setEditingAgent(agent);
        setEditName(agent.name);
        setEditDescription(agent.description || '');
    };

    // Function to save edited agent
    const handleSaveEdit = async () => {
        if (!editingAgent || !editName.trim()) return;
        
        setIsSaving(true);
        try {
            const response = await fetch(`http://localhost:3001/api/agents/${editingAgent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    name: editName.trim(),
                    description: editDescription.trim() || undefined
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Update the agents list with the edited agent
            setAgents(agents.map(agent => 
                agent.id === editingAgent.id ? { ...agent, name: editName, description: editDescription } : agent
            ));
            
            // Close the edit dialog
            setEditingAgent(null);
        } catch (err: any) {
            console.error("Failed to update agent:", err);
            alert(`Error updating agent: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Function to cancel editing
    const handleCancelEdit = () => {
        setEditingAgent(null);
    };

    // Function to delete an agent
    const handleDeleteAgent = async (agentId: string) => {
        if (!window.confirm('Are you sure you want to delete this agent?')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3001/api/agents/${agentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            
            // Remove the deleted agent from the state
            setAgents(agents.filter(agent => agent.id !== agentId));
        } catch (err: any) {
            console.error("Failed to delete agent:", err);
            alert(`Error deleting agent: ${err.message}`);
        }
    };

    // Function to handle GitHub export
    const handleGitHubExport = (agent: Agent) => {
        setSelectedAgentForExport(agent);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>My Automation Agents</h1>

            {isLoading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f3f3', 
                        borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 2s linear infinite' }}></div>
                    <p>Loading your agents...</p>
                </div>
            )}
            
            {error && (
                <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {!isLoading && !error && (
                <>
                    {agents.length === 0 ? (
                        <div style={{ backgroundColor: '#f5f5f5', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                            <h3>You haven't created any agents yet</h3>
                            <p>To create your first agent, go to the Home page and enter a Loom URL to analyze.</p>
                            <button 
                                onClick={() => navigate('/')}
                                style={{ 
                                    backgroundColor: '#4caf50', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '10px 15px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    marginTop: '15px'
                                }}
                            >
                                Create Your First Agent
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                {agents.map(agent => (
                                    <div key={agent.id} style={{ 
                                        border: '1px solid #e0e0e0', 
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        padding: '20px',
                                        backgroundColor: 'white',
                                        position: 'relative'
                                    }}>
                                        <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{agent.name}</h2>
                                        
                                        {agent.description && (
                                            <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>{agent.description}</p>
                                        )}
                                        
                                        <div style={{ fontSize: '14px', color: '#95a5a6', marginBottom: '20px' }}>
                                            <div>Created: {new Date(agent.created_at).toLocaleString()}</div>
                                            <div style={{ wordBreak: 'break-all' }}>
                                                Loom: <a href={agent.loom_url} target="_blank" rel="noopener noreferrer">{agent.loom_url}</a>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button 
                                                onClick={() => handleRunAgent(agent)}
                                                disabled={isRunning}
                                                style={{ 
                                                    backgroundColor: '#3498db', 
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 15px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    flexGrow: 1
                                                }}
                                            >
                                                {isRunning && selectedAgent?.id === agent.id ? 'Running...' : 'Run Agent'}
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleEditAgent(agent)}
                                                style={{ 
                                                    backgroundColor: '#2ecc71', 
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 15px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    flexGrow: 1
                                                }}
                                            >
                                                Edit Agent
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleDeleteAgent(agent.id)}
                                                style={{ 
                                                    backgroundColor: '#e74c3c', 
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 15px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>

                                            <button 
                                                onClick={() => handleGitHubExport(agent)}
                                                style={{ 
                                                    backgroundColor: '#34495e', 
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 15px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                GitHub
                                            </button>
                                        </div>
                                        
                                        {selectedAgentForExport?.id === agent.id && (
                                            <GitHubExport 
                                                agentId={agent.id} 
                                                agentName={agent.name} 
                                                agentConfig={{
                                                    loomUrl: agent.loom_url,
                                                    created: agent.created_at,
                                                    description: agent.description || ''
                                                }} 
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Edit Agent Modal */}
            {editingAgent && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginTop: 0 }}>Edit Agent</h2>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
                            <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description:</label>
                            <textarea 
                                value={editDescription} 
                                onChange={(e) => setEditDescription(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '16px',
                                    minHeight: '100px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button 
                                onClick={handleCancelEdit}
                                style={{
                                    padding: '8px 15px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f5f5f5',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                disabled={isSaving || !editName.trim()}
                                style={{
                                    padding: '8px 15px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    backgroundColor: '#2ecc71',
                                    color: 'white',
                                    cursor: 'pointer',
                                    opacity: isSaving || !editName.trim() ? 0.7 : 1
                                }}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AgentDashboard; 