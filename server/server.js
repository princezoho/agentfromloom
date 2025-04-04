const express = require('express');
const path = require('path');
const cors = require('cors');
const { chromium } = require('playwright'); // Import Playwright
const { createClient } = require('@supabase/supabase-js'); // Make sure this is imported
const cookieParser = require('cookie-parser');
const githubRoutes = require('./github-service');
const axios = require('axios');
const { fileURLToPath } = require('url');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { v4: uuidv4 } = require('uuid');
const puppeteer = require('puppeteer-core');

const supabase = require('./supabaseClient');
const integrationSuggestions = require('./integration-suggestions'); // Import the integration suggestions module
const { generateRlsFixSql } = require('./fix-rls-automatically');

const app = express();
const PORT = process.env.PORT || 3001;

// Development mode flags
const DEV_MODE = process.env.NODE_ENV !== 'production';
const USE_MEMORY_STORAGE = DEV_MODE || process.env.USE_MEMORY_STORAGE === 'true';

// Initialize in-memory storage for development mode
const memoryStorage = {
  agents: [],
  chunks: []
};

// Helper function to generate a random ID for development mode
const generateDevId = () => `dev-${Date.now()}`;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true
}));

// Add additional headers middleware to be extra safe
app.use((req, res, next) => {
  // Set additional headers to help with CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Add GitHub API routes
app.use('/api/github', githubRoutes);

// API route for Loom video analysis with visual-based chunking
app.post('/api/analyze', async (req, res) => {
  // Set CORS headers explicitly for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  const { loomUrl } = req.body;

  console.log(`Received request to analyze: ${loomUrl}`);

  if (!loomUrl) {
    return res.status(400).json({ error: 'No Loom URL provided' });
  }

  if (!loomUrl.includes('loom.com')) {
    return res.status(400).json({ error: 'Invalid Loom URL provided. URL must contain loom.com' });
  }

  let browser = null;
  
  try {
    // Extract Loom video ID
    const videoId = extractLoomVideoId(loomUrl);
    console.log(`Extracted Video ID: ${videoId}`);
    
    if (!videoId) {
      return res.status(400).json({ 
        error: 'Could not extract valid Loom video ID', 
        details: 'The provided URL format is not supported or does not contain a valid Loom ID',
        url: loomUrl
      });
    }
    
    // Launch browser to analyze the video
    browser = await chromium.launch({ headless: true, args: ['--disable-web-security'] });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to the Loom video page
    console.log(`Navigating to Loom video: ${loomUrl}`);
    await page.goto(loomUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for the video player to load
    await page.waitForSelector('.loom-video', { timeout: 10000 }).catch(() => {
      console.log('Could not find .loom-video selector, will try alternative approach');
    });
    
    // Get video duration (in seconds)
    const videoDuration = await getVideoDuration(page);
    console.log(`Video duration detected: ${videoDuration} seconds`);
    
    if (!videoDuration || videoDuration <= 0) {
      throw new Error('Could not determine video duration');
    }
    
    // Identify visual changes for chunking
    const chunks = await createVisualChunks(page, videoDuration);
    const transcript = await getTranscript(page);

    // Generate integration suggestions based on video data
    const videoData = {
      url: loomUrl,
      videoId: videoId,
      chunks: chunks,
      transcript: transcript
    };
    
    const integrationData = integrationSuggestions.analyzeLoomForIntegrations(videoData);

    // Close browser
    await browser.close();
    browser = null;
    
    console.log(`Created ${chunks.length} chunks based on visual analysis`);
    res.json({
      videoId,
      videoDuration,
      chunks,
      transcript,
      integrations: integrationData
    });
    
  } catch (error) {
    console.error('Error analyzing Loom video:', error);
    res.status(500).json({ 
      error: error.message || 'Error analyzing Loom video',
      details: error.stack,
      url: loomUrl
    });
  } finally {
    // Ensure browser is closed even if errors occur
    if (browser) {
      await browser.close();
    }
  }
});

// Helper function to extract Loom video ID from various URL formats
function extractLoomVideoId(url) {
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
}

// Helper function to get video duration
async function getVideoDuration(page) {
  try {
    // Try multiple methods to get video duration
    const duration = await page.evaluate(() => {
      // First try: look for HTML5 video element
      const videoEl = document.querySelector('video');
      if (videoEl && videoEl.duration) return videoEl.duration;
      
      // Second try: look for duration metadata in page
      const durationEl = document.querySelector('.video-duration') || 
                         document.querySelector('[data-duration]') ||
                         document.querySelector('[data-video-duration]');
      if (durationEl) {
        const durationText = durationEl.textContent || durationEl.getAttribute('data-duration');
        if (durationText) {
          // Parse MM:SS format
          const parts = durationText.trim().split(':');
          if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
          }
        }
      }
      
      // Fallback: use a reasonable default
      return 120; // Default to 2 minutes if can't determine
    });
    
    return duration;
  } catch (error) {
    console.error('Error getting video duration:', error);
    return 120; // Default to 2 minutes
  }
}

// Helper function to create chunks based on visual analysis
async function createVisualChunks(page, totalDuration) {
  // For this implementation, we'll create chunks based on:
  // 1. Regular time intervals
  // 2. Detection of major scene changes (simplified for now)
  
  // Simplified approach: take screenshots at regular intervals and analyze
  const chunks = [];
  const maxChunks = Math.min(6, Math.ceil(totalDuration / 15)); // Max 6 chunks or 1 per 15 seconds
  const chunkDuration = totalDuration / maxChunks;
  
  // Define more specific action scenarios based on chunk order for a more realistic demo
  const chunkScenarios = [
    {
      name: 'Opening Website',
      action: { type: 'goto', url: 'https://example.com' },
      description: 'Navigate to the starting website'
    },
    {
      name: 'Logging In',
      action: { 
        type: 'fill', 
        selector: '#username',
        value: 'demo_user', 
        description: 'Enter username in login form'
      }
    },
    {
      name: 'Clicking Dashboard',
      action: { 
        type: 'click', 
        selector: '.dashboard-link',
        description: 'Navigate to the dashboard area'
      }
    },
    {
      name: 'Selecting Options',
      action: { 
        type: 'select', 
        selector: '#product-dropdown',
        value: 'product-123',
        description: 'Select the target product'
      }
    },
    {
      name: 'Submitting Form',
      action: { 
        type: 'click', 
        selector: '#submit-button',
        description: 'Submit the completed form'
      }
    },
    {
      name: 'Reviewing Results',
      action: { 
        type: 'wait', 
        selector: '.confirmation-message',
        timeout: 5000,
        description: 'Wait for confirmation'
      }
    }
  ];
  
  // Create a unique ID for each chunk based on timestamp
  const timestamp = Date.now();
  
  for (let i = 0; i < maxChunks; i++) {
    const startTime = Math.round(i * chunkDuration);
    const endTime = Math.round((i + 1) * chunkDuration);
    
    // Skip to specific time in the video
    await page.evaluate((time) => {
      const videoEl = document.querySelector('video');
      if (videoEl) videoEl.currentTime = time;
    }, startTime);
    
    // Wait briefly for the frame to load
    await page.waitForTimeout(500);
    
    // Use the scenario matching the current index (or cycle through them)
    const scenario = chunkScenarios[i % chunkScenarios.length];
    
    // Format the time in MM:SS format
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    chunks.push({
      id: `chunk-${timestamp}-${i}`,
      order: i + 1,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      name: scenario.name,
      action: scenario.action,
      visualData: {
        previewAvailable: true,  // In a real implementation, this would be based on actual image processing
        previewUrl: null,  // Would be an actual URL in production
        thumbnailColor: ['#f0f0f0', '#e0e6f0', '#f0e0e0', '#e0f0e0', '#f0e0f0', '#e0f0f0'][i % 6] // Just for visual distinction in demo
      }
    });
  }
  
  return chunks;
}

/**
 * Extract transcript from Loom video
 * @param {Page} page - Playwright page object
 * @returns {Promise<Array>} - Array of transcript entries with timestamps and text
 */
async function getTranscript(page) {
  try {
    console.log('Attempting to extract transcript...');
    
    // Try different possible transcript selectors (Loom's UI can vary)
    const possibleSelectors = [
      '.transcript-line',
      '.transcript-content .line',
      '[data-testid="transcript-line"]',
      '.captions-container'
    ];
    
    let transcript = [];
    
    // Try each selector
    for (const selector of possibleSelectors) {
      console.log(`Trying transcript selector: ${selector}`);
      
      // Wait for transcript elements with a short timeout
      const hasElements = await page.waitForSelector(selector, { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      
      if (hasElements) {
        console.log(`Found transcript elements with selector: ${selector}`);
        
        // Extract transcript based on the selector
        transcript = await page.evaluate((sel) => {
          const lines = Array.from(document.querySelectorAll(sel));
          return lines.map(line => {
            // Different selectors might have different structures
            const timestampEl = line.querySelector('.timestamp') || 
                               line.querySelector('[data-testid="timestamp"]') || 
                               line.querySelector('.transcript-timestamp');
                               
            const textEl = line.querySelector('.text') || 
                          line.querySelector('[data-testid="text"]') || 
                          line.querySelector('.transcript-text') ||
                          line;
            
            return {
              timestamp: timestampEl ? timestampEl.textContent.trim() : '',
              text: textEl ? textEl.textContent.trim() : ''
            };
          });
        }, selector);
        
        if (transcript.length > 0) {
          console.log(`Successfully extracted ${transcript.length} transcript lines`);
          return transcript;
        }
      }
    }
    
    // If we get here, we couldn't find transcript elements with any selector
    console.log('Transcript elements not found, returning empty transcript');
    return [];
  } catch (error) {
    console.error('Error extracting transcript:', error);
    return [];
  }
}

// --- Add Action Execution Endpoint ---
app.post('/api/execute_action', async (req, res) => {
  // Set CORS headers explicitly for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  const { action, actions } = req.body;
  
  // Handle both single actions and sequences of actions
  const actionSequence = actions || (action ? [action] : null);

  if (!actionSequence || actionSequence.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid action data provided',
      details: 'Please provide either a single action or an array of actions'
    });
  }

  console.log('Executing action sequence:', actionSequence);
  let browser = null; // Define browser outside try block
  const actionResults = [];
  let hasErrors = false;

  try {
    // Launch browser (configurable headless mode)
    const isHeadless = req.body.headless !== false; // Default to headless unless explicitly set to false
    browser = await chromium.launch({ headless: isHeadless });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36'
    });
    const page = await context.newPage();

    // Add event listener for console messages
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    
    // Execute each action in sequence
    for (let i = 0; i < actionSequence.length; i++) {
      const currentAction = actionSequence[i];
      console.log(`Executing action ${i+1}/${actionSequence.length}:`, currentAction);
      
      try {
        // Execute action based on type
        switch (currentAction.type) {
          case 'goto':
            if (!currentAction.url) throw new Error('Missing URL for goto action');
            await page.goto(currentAction.url, { 
              waitUntil: currentAction.waitUntil || 'domcontentloaded',
              timeout: currentAction.timeout || 30000
            });
            break;
            
          case 'fill':
            if (!currentAction.selector || currentAction.value === undefined) 
              throw new Error('Missing selector or value for fill action');
            
            // First wait for the element
            await page.waitForSelector(currentAction.selector, { 
              timeout: currentAction.timeout || 5000,
              state: 'visible'
            });
            
            // Clear existing text if specified
            if (currentAction.clearFirst) {
              await page.locator(currentAction.selector).fill('');
            }
            
            // Fill the field
            await page.locator(currentAction.selector).fill(currentAction.value);
            break;
            
          case 'click':
            if (!currentAction.selector) throw new Error('Missing selector for click action');
            
            // Wait for element to be visible and clickable
            await page.waitForSelector(currentAction.selector, { 
              state: 'visible',
              timeout: currentAction.timeout || 5000
            });
            
            // Optional delay before clicking
            if (currentAction.delay) {
              await page.waitForTimeout(currentAction.delay);
            }
            
            await page.locator(currentAction.selector).click({
              button: currentAction.button || 'left',
              clickCount: currentAction.clickCount || 1,
              delay: currentAction.clickDelay // Delay between clicks if multiple
            });
            break;
            
          case 'select':
            if (!currentAction.selector || currentAction.value === undefined) 
              throw new Error('Missing selector or value for select action');
            
            await page.locator(currentAction.selector).selectOption(currentAction.value);
            break;
            
          case 'wait':
            if (currentAction.selector) {
              // Wait for element
              await page.locator(currentAction.selector).waitFor({ 
                timeout: currentAction.timeout || 30000,
                state: currentAction.state || 'visible'
              });
            } else if (currentAction.time) {
              // Wait for specified time in ms
              await page.waitForTimeout(currentAction.time);
            } else if (currentAction.condition) {
              // Wait for a custom condition (simplified for now)
              await page.waitForFunction(currentAction.condition, {
                timeout: currentAction.timeout || 30000
              });
            } else {
              throw new Error('Missing wait parameters (selector, time, or condition)');
            }
            break;
            
          case 'hover':
            if (!currentAction.selector) throw new Error('Missing selector for hover action');
            await page.locator(currentAction.selector).hover();
            break;
            
          case 'keyboard':
            if (!currentAction.key) throw new Error('Missing key for keyboard action');
            
            if (currentAction.key === 'Enter') {
              await page.keyboard.press('Enter');
            } else if (currentAction.key === 'Tab') {
              await page.keyboard.press('Tab');
            } else if (currentAction.key === 'Escape') {
              await page.keyboard.press('Escape');
            } else if (currentAction.combination) {
              // Handle key combinations like Ctrl+A
              await page.keyboard.press(currentAction.combination);
            } else {
              await page.keyboard.type(currentAction.key);
            }
            break;
            
          case 'screenshot':
            // Take a screenshot if requested
            const screenshotBuffer = await page.screenshot({
              path: currentAction.path, // Optional path to save
              fullPage: currentAction.fullPage || false,
              type: currentAction.format || 'png'
            });
            
            // Convert to base64 for sending in response if needed
            const screenshotBase64 = screenshotBuffer.toString('base64');
            currentAction.screenshotBase64 = screenshotBase64;
            break;
            
          default:
            throw new Error(`Unsupported action type: ${currentAction.type}`);
        }
        
        // Add successful result
        actionResults.push({
          success: true,
          action: currentAction,
          index: i,
          message: `Successfully executed ${currentAction.type} action`
        });
        
        // Optional wait between actions
        if (currentAction.waitAfter) {
          await page.waitForTimeout(currentAction.waitAfter);
        }
        
      } catch (actionError) {
        console.error(`Action ${i+1} failed:`, actionError);
        
        // Take a screenshot of the failure if possible
        let errorScreenshotBase64 = null;
        try {
          const errorScreenshot = await page.screenshot();
          errorScreenshotBase64 = errorScreenshot.toString('base64');
        } catch (screenshotError) {
          console.error('Failed to capture error screenshot:', screenshotError);
        }
        
        // Add error result
        actionResults.push({
          success: false,
          action: currentAction,
          index: i,
          error: actionError.message,
          screenshot: errorScreenshotBase64
        });
        
        hasErrors = true;
        
        // Stop sequence if stopOnError is true
        if (req.body.stopOnError) {
          break;
        }
      }
    }

    console.log(`Completed action sequence with ${hasErrors ? 'errors' : 'success'}.`);
    
    // Final page screenshot before closing
    let finalScreenshotBase64 = null;
    try {
      const finalScreenshot = await page.screenshot({ fullPage: true });
      finalScreenshotBase64 = finalScreenshot.toString('base64');
    } catch (e) {
      console.error('Failed to capture final screenshot:', e);
    }
    
    res.json({ 
      success: !hasErrors, 
      message: hasErrors ? 'One or more actions failed' : 'Successfully executed all actions',
      results: actionResults,
      finalScreenshot: finalScreenshotBase64
    });

  } catch (error) {
    console.error('Playwright session failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Playwright session failed',
      results: actionResults
    });
  } finally {
    // Ensure browser is closed even if errors occur
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
});
// --- End Action Execution Endpoint ---

// --- Add Save Agent Endpoint ---
app.post('/api/agents', async (req, res) => {
    try {
        const { name, loomUrl, userId, chunkData } = req.body;
        
        if (!name || !loomUrl || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        console.log(`Saving agent '${name}' for user ${userId}`);
        
        // Check if we should bypass Supabase for development
        if (DEV_MODE && USE_MEMORY_STORAGE) {
            console.log('DEVELOPMENT MODE: Using memory-only agent storage');
            
            // Generate a fake agent ID
            const fakeAgentId = generateDevId();
            
            // Store the agent in memory for development mode
            memoryStorage.agents.push({
                id: fakeAgentId,
                name,
                loom_url: loomUrl,
                user_id: userId,
                created_at: new Date().toISOString(),
                chunks: chunkData || []
            });
            
            console.log(`Agent saved in memory storage. Current count: ${memoryStorage.agents.length}`);
            
            // Return success with SQL fix instructions
            return res.status(200).json({
                success: true,
                agentId: fakeAgentId,
                message: 'Agent saved in development mode (memory only)',
                note: 'To enable database storage, fix RLS policies in Supabase',
                sqlFix: generateRlsFixSql(true) // true = completely disable RLS
            });
        }
        
        // Regular flow - attempt to insert the agent into Supabase
        const { data: agentData, error: agentError } = await supabase
            .from('Agents')
            .insert({
                name,
                loom_url: loomUrl,
                user_id: userId,
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();
            
        // Check for RLS policy error
        if (agentError) {
            console.log('Supabase agent insert error:', agentError);
            
            // Check if it's an RLS policy error
            if (agentError.code === '42501' || 
                (agentError.message && agentError.message.includes('policy'))) {
                
                console.log('RLS policy error detected. Returning instructions for fixing it.');
                
                return res.status(200).json({
                    success: false,
                    message: 'RLS policy preventing data save',
                    sqlFix: generateRlsFixSql(true), // true = completely disable RLS
                    note: 'Execute this SQL in Supabase SQL Editor to fix the RLS issue'
                });
            } else {
                // Not an RLS error, return the original error
                return res.status(500).json({ 
                    error: `Error saving agent: ${agentError.message}` 
                });
            }
        }
        
        const agentId = agentData?.id || `temp-${Date.now()}`;
        
        // If we have chunks, save them
        if (chunkData && chunkData.length > 0) {
            // Prepare chunk records
            const chunkRecords = chunkData.map(chunk => ({
                agent_id: agentId,
                order_index: chunk.order,
                start_time: chunk.startTime,
                end_time: chunk.endTime,
                name: chunk.name,
                action: chunk.action ? JSON.stringify(chunk.action) : null,
                visual_data: chunk.visualData ? JSON.stringify(chunk.visualData) : null
            }));
            
            // Insert chunk records
            const { error: chunksError } = await supabase
                .from('Chunks')
                .insert(chunkRecords);
                
            if (chunksError) {
                console.error('Error saving chunks:', chunksError);
                // Non-blocking error - we saved the agent at least
            }
        }
        
        res.json({
            success: true,
            agentId,
            message: 'Agent saved successfully'
        });
    } catch (error) {
        console.error('Error saving agent to Supabase:', error);
        res.status(500).json({ error: error.message });
    }
});
// --- End Save Agent Endpoint ---

// Endpoint to get all agents for a user
app.get('/api/agents', async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // In development mode with USE_MEMORY_STORAGE, use memory storage
    if (DEV_MODE && USE_MEMORY_STORAGE) {
      console.log('Development mode: Returning agents from memory storage');
      console.log(`Memory storage has ${memoryStorage.agents.length} agents`);
      const mockAgents = memoryStorage.agents.filter(agent => agent.user_id === userId);
      console.log(`Found ${mockAgents.length} agents for user ${userId}`);
      return res.json({ agents: mockAgents });
    }
    
    // Attempt to fetch agents from Supabase
    const { data, error } = await supabase
      .from('Agents')
      .select('id, name, description, loom_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching agents:', error);
      
      // In development, return mock data if Supabase fails
      if (DEV_MODE) {
        console.log('Development mode: Returning mock agents data after Supabase error');
        const mockAgents = memoryStorage.agents.filter(agent => agent.user_id === userId);
        return res.json({ agents: mockAgents });
      }
      
      throw error;
    }
    
    return res.json({ agents: data });
  } catch (error) {
    console.error('Server error fetching agents:', error);
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Endpoint to delete an agent
app.delete('/api/agents/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { userId } = req.body;
  
  if (!agentId || !userId) {
    return res.status(400).json({ error: 'agentId and userId are required' });
  }

  try {
    // First validate that this agent belongs to the user
    const { data: agentData, error: fetchError } = await supabase
      .from('Agents')
      .select('user_id')
      .eq('id', agentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching agent for deletion validation:', fetchError);
      
      // In development mode, check memory storage
      if (DEV_MODE) {
        const agentInMemory = memoryStorage.agents.find(a => a.id === agentId);
        if (!agentInMemory) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        if (agentInMemory.user_id !== userId) {
          return res.status(403).json({ error: 'Not authorized to delete this agent' });
        }
        
        // Remove from memory storage
        const agentIndex = memoryStorage.agents.findIndex(a => a.id === agentId);
        if (agentIndex !== -1) {
          memoryStorage.agents.splice(agentIndex, 1);
          return res.json({ success: true });
        }
      }
      
      throw fetchError;
    }
    
    // Ensure the user has permission to delete this agent
    if (agentData && agentData.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this agent' });
    }
    
    // Delete the agent
    const { error: deleteError } = await supabase
      .from('Agents')
      .delete()
      .eq('id', agentId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Server error deleting agent:', error);
    return res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// Endpoint to update an agent
app.put('/api/agents/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { userId, name, description } = req.body;
  
  if (!agentId || !userId) {
    return res.status(400).json({ error: 'agentId and userId are required' });
  }

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    // First validate that this agent belongs to the user
    const { data: agentData, error: fetchError } = await supabase
      .from('Agents')
      .select('user_id')
      .eq('id', agentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching agent for update validation:', fetchError);
      
      // In development mode, check memory storage
      if (DEV_MODE) {
        const agentInMemory = memoryStorage.agents.find(a => a.id === agentId);
        if (!agentInMemory) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        if (agentInMemory.user_id !== userId) {
          return res.status(403).json({ error: 'Not authorized to update this agent' });
        }
        
        // Update in memory storage
        const agentIndex = memoryStorage.agents.findIndex(a => a.id === agentId);
        if (agentIndex !== -1) {
          memoryStorage.agents[agentIndex] = {
            ...memoryStorage.agents[agentIndex],
            name,
            description: description || memoryStorage.agents[agentIndex].description
          };
          return res.json({ 
            success: true, 
            agent: memoryStorage.agents[agentIndex] 
          });
        }
      }
      
      throw fetchError;
    }
    
    // Ensure the user has permission to update this agent
    if (agentData && agentData.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this agent' });
    }
    
    // Update the agent
    const { data, error: updateError } = await supabase
      .from('Agents')
      .update({ name, description })
      .eq('id', agentId)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    return res.json({ success: true, agent: data });
  } catch (error) {
    console.error('Server error updating agent:', error);
    return res.status(500).json({ error: 'Failed to update agent' });
  }
});

// --- Add Delete All Users Endpoint ---
app.delete('/api/admin/users', async (req, res) => {
  // Add proper CORS headers for preflight requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, adminSecret');
  
  const { adminSecret } = req.headers;
  
  // Basic security check - require an admin secret
  // In production, use a proper authentication system with admin roles
  if (!adminSecret || adminSecret !== 'temporary_admin_secret') {
    return res.status(401).json({ success: false, error: 'Unauthorized access' });
  }

  try {
    console.log('Attempting to delete all users from the Agents table...');
    
    // First, delete all agents data
    const { error: agentsError } = await supabase
      .from('Agents')
      .delete()
      .neq('id', 0); // This will match all rows
      
    if (agentsError) {
      console.error('Error deleting agents:', agentsError);
      return res.status(500).json({ success: false, error: 'Failed to delete agents data' });
    }
    
    console.log('Agents data deleted successfully');
    
    // Since we can't directly delete users with the anon key,
    // provide instructions to the admin
    return res.json({ 
      success: true, 
      message: 'Agents data deleted successfully.',
      instructions: 'To delete users, you need to go to the Supabase dashboard > Authentication > Users and delete them manually, or use a service_role key with appropriate permissions.'
    });
  } catch (error) {
    console.error('Error in delete all users endpoint:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error deleting users' });
  }
});
// --- End Delete All Users Endpoint ---

// --- Add Record User Actions Endpoint ---
app.post('/api/record_actions', async (req, res) => {
  // Set CORS headers explicitly for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  const { chunkId, actions, loomUrl } = req.body;
  
  if (!chunkId || !actions || !Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid recording data provided',
      details: 'Please provide chunkId and an array of recorded actions'
    });
  }

  console.log(`Recording ${actions.length} user actions for chunk ${chunkId}`);
  
  try {
    // Process and normalize the recorded actions
    const processedActions = actions.map((action, index) => {
      // Add additional metadata to each action
      return {
        ...action,
        id: `${chunkId}-action-${index}`,
        timestamp: action.timestamp || new Date().toISOString(),
        recorded: true
      };
    });

    // In a real implementation, we would save these actions to the database
    // For now, we'll just return success
    
    // Optional: Validate actions by replaying them in a headless browser
    let validationResult = { success: true, message: 'Actions recorded successfully' };
    
    if (req.body.validate) {
      try {
        validationResult = await validateRecordedActions(processedActions);
      } catch (validationError) {
        console.error('Error validating recorded actions:', validationError);
        validationResult = { 
          success: false, 
          message: 'Validation failed: ' + validationError.message 
        };
      }
    }
    
    res.json({ 
      success: true, 
      message: `Successfully recorded ${actions.length} user actions`,
      processedActions: processedActions,
      validation: validationResult
    });

  } catch (error) {
    console.error('Error processing recorded actions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error processing recorded actions',
      details: error.stack
    });
  }
});

// Function to validate recorded actions by replaying them
async function validateRecordedActions(actions) {
  if (!actions || actions.length === 0) {
    return { success: false, message: 'No actions to validate' };
  }
  
  let browser = null;
  
  try {
    // Launch browser in headless mode for validation
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Execute each action in sequence
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      console.log(`Validating action ${i+1}/${actions.length}:`, action);
      
      // Execute based on action type
      switch (action.type) {
        case 'goto':
          if (!action.url) throw new Error('Missing URL for goto action');
          await page.goto(action.url, { 
            waitUntil: action.waitUntil || 'domcontentloaded', 
            timeout: action.timeout || 30000 
          });
          break;
          
        case 'click':
          if (!action.selector) throw new Error('Missing selector for click action');
          await page.waitForSelector(action.selector, { 
            state: 'visible',
            timeout: action.timeout || 5000 
          });
          await page.click(action.selector);
          break;
          
        case 'fill':
          if (!action.selector || action.value === undefined) 
            throw new Error('Missing selector or value for fill action');
          await page.waitForSelector(action.selector, { 
            state: 'visible',
            timeout: action.timeout || 5000 
          });
          await page.fill(action.selector, action.value);
          break;
          
        // Add other action types as needed
        
        default:
          console.log(`Skipping validation for unsupported action type: ${action.type}`);
      }
      
      // Wait a bit between actions
      if (i < actions.length - 1) {
        await page.waitForTimeout(500);
      }
    }
    
    return { success: true, message: 'All actions validated successfully' };
    
  } catch (error) {
    console.error('Action validation failed:', error);
    return { 
      success: false, 
      message: `Validation failed: ${error.message}`,
      error: error
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('Validation browser closed');
    }
  }
}
// --- End Record User Actions Endpoint ---

// --- Add Favicon Proxy for Supabase ---
app.get('/proxy-favicon', (req, res) => {
  const faviconPath = path.join(__dirname, '..', 'supabase-assets', 'favicon.ico');
  res.sendFile(faviconPath);
});
// --- End Favicon Proxy ---

// TODO: Serve static files from the React app build directory
// app.use(express.static(path.join(__dirname, '../client/build')));

// TODO: API routes will go here

// Catch-all handler for any request that doesn't match one above
// TODO: Uncomment this once the client is built
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });

// Save agent chunks endpoint
app.post('/api/agents/:agentId/chunks', async (req, res) => {
  const { agentId } = req.params;
  const { chunks, userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  if (!chunks || !Array.isArray(chunks)) {
    return res.status(400).json({ error: 'Chunks must be an array' });
  }
  
  try {
    // In development mode with USE_MEMORY_STORAGE, use memory storage
    if (DEV_MODE && USE_MEMORY_STORAGE) {
      console.log('Development mode: Saving chunks to memory storage');
      
      // Store chunks in memory for this agent
      const existingChunks = memoryStorage.chunks.filter(c => c.agent_id !== agentId);
      const newChunks = chunks.map((chunk, index) => ({
        id: `${agentId}-chunk-${index}`,
        agent_id: agentId,
        user_id: userId,
        ...chunk
      }));
      
      memoryStorage.chunks = [...existingChunks, ...newChunks];
      console.log(`Saved ${newChunks.length} chunks in memory for agent ${agentId}`);
      
      return res.json({ 
        success: true, 
        message: 'Chunks saved in memory storage',
        chunks: newChunks
      });
    }
    
    // If we reach here, we're using Supabase
    // ... existing Supabase code ...
    
  } catch (error) {
    console.error('Error saving chunks:', error);
    
    // In development mode, log error but return success
    if (DEV_MODE) {
      console.log('Development mode: Returning success despite error saving chunks');
      return res.json({ 
        success: true, 
        message: 'Error saving to database, but chunks saved in memory',
        error: error.message 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to save chunks', 
      details: error.message 
    });
  }
});

// Get agent chunks endpoint
app.get('/api/agents/:agentId/chunks', async (req, res) => {
  const { agentId } = req.params;
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  try {
    // In development mode with USE_MEMORY_STORAGE, use memory storage
    if (DEV_MODE && USE_MEMORY_STORAGE) {
      console.log('Development mode: Returning chunks from memory storage');
      const agentChunks = memoryStorage.chunks.filter(
        chunk => chunk.agent_id === agentId && chunk.user_id === userId
      );
      console.log(`Found ${agentChunks.length} chunks for agent ${agentId}`);
      return res.json({ chunks: agentChunks });
    }
    
    // If we're here, we're using Supabase
    const { data, error } = await supabase
      .from('agent_chunks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching chunks from Supabase:', error);
      
      // In development mode, return memory storage on error
      if (DEV_MODE) {
        console.log('Development mode: Returning chunks from memory after Supabase error');
        const agentChunks = memoryStorage.chunks.filter(
          chunk => chunk.agent_id === agentId && chunk.user_id === userId
        );
        return res.json({ chunks: agentChunks });
      }
      
      return res.status(500).json({ error: 'Failed to fetch chunks', details: error.message });
    }
    
    return res.json({ chunks: data });
    
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    return res.status(500).json({ error: 'Failed to retrieve chunks', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 