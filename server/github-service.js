const axios = require('axios');
const express = require('express');
const router = express.Router();

// GitHub OAuth credentials - in a real implementation, these would be stored as environment variables
const GITHUB_CLIENT_ID = 'your_github_client_id';  // Replace with your GitHub OAuth app client ID
const GITHUB_CLIENT_SECRET = 'your_github_client_secret';  // Replace with your GitHub OAuth app client secret
const REDIRECT_URI = 'http://localhost:3001/api/github/callback';

// In-memory storage for tokens (in production, you'd use a database or a more secure storage)
const tokens = {};

// Middleware to check if request has a valid GitHub session
const requireGitHubAuth = (req, res, next) => {
    const sessionId = req.cookies['github_session_id'];
    if (!sessionId || !tokens[sessionId]) {
        return res.status(401).json({ authenticated: false, error: 'GitHub authentication required' });
    }
    req.githubToken = tokens[sessionId];
    next();
};

// Route to check if user is authenticated with GitHub
router.get('/auth-status', (req, res) => {
    const sessionId = req.cookies['github_session_id'];
    const isAuthenticated = !!sessionId && !!tokens[sessionId];
    res.json({ authenticated: isAuthenticated });
});

// Route to initiate GitHub OAuth flow
router.get('/auth', (req, res) => {
    // Generate a unique session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Set the session ID in a cookie
    res.cookie('github_session_id', sessionId, { httpOnly: true, maxAge: 3600000 }); // 1 hour
    
    // Redirect to GitHub's authorization endpoint
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=repo`;
    res.redirect(githubAuthUrl);
});

// Route to handle OAuth callback from GitHub
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    const sessionId = req.cookies['github_session_id'];
    
    if (!code || !sessionId) {
        return res.status(400).json({ error: 'Invalid request' });
    }
    
    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI
        }, {
            headers: {
                Accept: 'application/json'
            }
        });
        
        // Store the token
        tokens[sessionId] = tokenResponse.data.access_token;
        
        // Redirect back to the client
        res.redirect('http://localhost:3000/dashboard?github_auth=success');
    } catch (error) {
        console.error('Error exchanging GitHub code for token:', error);
        res.status(500).json({ error: 'Failed to authenticate with GitHub' });
    }
});

// Route to export agent configuration to GitHub
router.post('/export', requireGitHubAuth, async (req, res) => {
    const { agentId, agentName, agentConfig, repoName, fileName, commitMessage } = req.body;
    const token = req.githubToken;
    
    if (!repoName || !fileName) {
        return res.status(400).json({ success: false, error: 'Repository name and file name are required' });
    }
    
    try {
        // Format the agent data for export
        const exportData = {
            id: agentId,
            name: agentName,
            exportedAt: new Date().toISOString(),
            ...agentConfig
        };
        
        // Convert to JSON string with pretty formatting
        const fileContent = JSON.stringify(exportData, null, 2);
        
        // Base64 encode the content (required by GitHub API)
        const contentEncoded = Buffer.from(fileContent).toString('base64');
        
        // Check if the file already exists by trying to get its SHA
        let fileSha = null;
        try {
            const fileResponse = await axios.get(`https://api.github.com/repos/${repoName}/contents/${fileName}`, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });
            fileSha = fileResponse.data.sha;
        } catch (error) {
            // File doesn't exist, which is fine for creating a new file
            if (error.response && error.response.status !== 404) {
                throw error;
            }
        }
        
        // Prepare the request to create or update the file
        const requestData = {
            message: commitMessage,
            content: contentEncoded,
            sha: fileSha // Include SHA only if updating an existing file
        };
        
        if (!fileSha) {
            delete requestData.sha; // Remove SHA if creating a new file
        }
        
        // Create or update the file in the repository
        const response = await axios.put(`https://api.github.com/repos/${repoName}/contents/${fileName}`, requestData, {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        
        res.json({
            success: true,
            message: fileSha ? 'File updated successfully' : 'File created successfully',
            repoUrl: `https://github.com/${repoName}/blob/master/${fileName}`,
            commitUrl: response.data.commit.html_url
        });
    } catch (error) {
        console.error('Error exporting to GitHub:', error);
        
        // Extract more meaningful error messages from GitHub API responses
        let errorMessage = 'Failed to export to GitHub';
        if (error.response) {
            if (error.response.data.message) {
                errorMessage = error.response.data.message;
                
                // Add more context for common errors
                if (errorMessage.includes('Not Found')) {
                    errorMessage = 'Repository not found. Please check the repository name and your access permissions.';
                } else if (errorMessage.includes('Validation Failed')) {
                    errorMessage = 'Validation failed. There might be an issue with the file path or content.';
                }
            }
        }
        
        res.status(500).json({ success: false, error: errorMessage });
    }
});

// Route to list user's repositories
router.get('/repos', requireGitHubAuth, async (req, res) => {
    const token = req.githubToken;
    
    try {
        const response = await axios.get('https://api.github.com/user/repos?sort=updated', {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });
        
        const repos = response.data.map(repo => ({
            id: repo.id,
            name: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            isPrivate: repo.private
        }));
        
        res.json({ success: true, repos });
    } catch (error) {
        console.error('Error fetching GitHub repositories:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch repositories' });
    }
});

module.exports = router; 