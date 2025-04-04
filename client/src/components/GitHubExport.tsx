import React, { useState } from 'react';

interface GitHubExportProps {
    agentId: string;
    agentName: string;
    agentConfig: any;
}

const GitHubExport: React.FC<GitHubExportProps> = ({ agentId, agentName, agentConfig }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<string | null>(null);
    const [repoName, setRepoName] = useState('');
    const [fileName, setFileName] = useState('agent-config.json');
    const [commitMessage, setCommitMessage] = useState('Add agent configuration');
    
    // Function to handle GitHub export
    const handleExportToGitHub = async () => {
        if (!repoName) {
            setExportStatus('Please enter a repository name');
            return;
        }
        
        setIsExporting(true);
        setExportStatus('Connecting to GitHub...');
        
        try {
            // First, check if the user is authenticated with GitHub
            const authCheck = await fetch('http://localhost:3001/api/github/auth-status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const authData = await authCheck.json();
            
            // If not authenticated, redirect to GitHub OAuth flow
            if (!authData.authenticated) {
                setExportStatus('Redirecting to GitHub for authentication...');
                // Store the export details in localStorage for after auth
                localStorage.setItem('pendingExport', JSON.stringify({
                    agentId,
                    repoName,
                    fileName,
                    commitMessage
                }));
                
                // Redirect to GitHub auth
                window.location.href = 'http://localhost:3001/api/github/auth';
                return;
            }
            
            // If authenticated, proceed with export
            setExportStatus('Exporting to GitHub...');
            
            const response = await fetch('http://localhost:3001/api/github/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentId,
                    agentName,
                    agentConfig,
                    repoName,
                    fileName,
                    commitMessage
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setExportStatus(`✅ Successfully exported to ${data.repoUrl}`);
            } else {
                throw new Error(data.error || 'Failed to export to GitHub');
            }
        } catch (err: any) {
            console.error('GitHub export error:', err);
            setExportStatus(`❌ Error: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };
    
    // Clear error/status message
    const handleFormChange = () => {
        if (exportStatus?.includes('Error')) {
            setExportStatus(null);
        }
    };
    
    return (
        <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ marginTop: 0 }}>Export to GitHub</h3>
            
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Repository Name:</label>
                <input 
                    type="text" 
                    value={repoName} 
                    onChange={(e) => { setRepoName(e.target.value); handleFormChange(); }}
                    placeholder="username/repository"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '3px' }}>
                    Format: username/repository (e.g., johndoe/my-agents)
                </small>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>File Name:</label>
                <input 
                    type="text" 
                    value={fileName} 
                    onChange={(e) => { setFileName(e.target.value); handleFormChange(); }}
                    placeholder="agent-config.json"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Commit Message:</label>
                <input 
                    type="text" 
                    value={commitMessage} 
                    onChange={(e) => { setCommitMessage(e.target.value); handleFormChange(); }}
                    placeholder="Add agent configuration"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
            </div>
            
            <button
                onClick={handleExportToGitHub}
                disabled={isExporting || !repoName.trim()}
                style={{ 
                    backgroundColor: '#2ecc71', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 15px', 
                    borderRadius: '4px', 
                    cursor: isExporting || !repoName.trim() ? 'not-allowed' : 'pointer',
                    opacity: isExporting || !repoName.trim() ? 0.7 : 1
                }}
            >
                {isExporting ? 'Exporting...' : 'Export to GitHub'}
            </button>
            
            {exportStatus && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: exportStatus.includes('❌') ? '#ffebee' : '#e8f5e9',
                    borderRadius: '4px',
                    color: exportStatus.includes('❌') ? '#c62828' : '#2e7d32'
                }}>
                    {exportStatus}
                </div>
            )}
        </div>
    );
};

export default GitHubExport; 