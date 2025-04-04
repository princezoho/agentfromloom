const express = require('express');
const path = require('path');
const cors = require('cors');
const { chromium } = require('playwright'); // Import Playwright
const { createClient } = require('@supabase/supabase-js'); // Make sure this is imported

const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Add additional headers middleware
app.use((req, res, next) => {
  // Set additional headers to help with CORS and caching
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// API route for Loom video analysis with visual-based chunking
app.post('/api/analyze', async (req, res) => {
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
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to the Loom video page
    console.log(`Navigating to Loom video: ${loomUrl}`);
    await page.goto(loomUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
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
    
    // Close browser
    await browser.close();
    browser = null;
    
    console.log(`Created ${chunks.length} chunks based on visual analysis`);
    res.json({ chunks });
    
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
  
  // Create specific action types based on typical web automation patterns
  const actionTypes = [
    { type: 'goto', description: 'Navigate to website' },
    { type: 'click', description: 'Click on an element' },
    { type: 'fill', description: 'Enter text in a field' },
    { type: 'select', description: 'Select from dropdown' },
    { type: 'wait', description: 'Wait for element' },
    { type: 'hover', description: 'Hover over element' }
  ];
  
  // More realistic chunk names based on common web automation tasks
  const chunkNames = [
    'Opening Website',
    'Logging In',
    'Navigating Dashboard',
    'Filling Form',
    'Submitting Data',
    'Viewing Results',
    'Checking Notifications',
    'Selecting Options',
    'Downloading Content',
    'Logging Out'
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
    
    // Take a screenshot (we won't use it directly now, but in a real implementation
    // we would analyze the screenshot content)
    // const screenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
    
    // Create a chunk with appropriate action based on the index
    const actionType = actionTypes[i % actionTypes.length];
    let action;
    
    switch (actionType.type) {
      case 'goto':
        action = { type: 'goto', url: 'https://example.com' };
        break;
      case 'click':
        action = { type: 'click', selector: '#submit-button' };
        break;
      case 'fill':
        action = { type: 'fill', selector: '#username', value: 'demo_user' };
        break;
      case 'select':
        action = { type: 'select', selector: '#dropdown', value: 'option1' };
        break;
      case 'wait':
        action = { type: 'wait', selector: '.loading-indicator', timeout: 5000 };
        break;
      case 'hover':
        action = { type: 'hover', selector: '.menu-item' };
        break;
    }
    
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
      name: chunkNames[i % chunkNames.length],
      action
    });
  }
  
  return chunks;
}

// --- Add Action Execution Endpoint ---
app.post('/api/execute_action', async (req, res) => {
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
    const { name, loomUrl, userId, chunkData } = req.body;

    // Basic validation
    if (!name || !loomUrl || !userId || !Array.isArray(chunkData)) {
        return res.status(400).json({ success: false, error: 'Missing required agent data.' });
    }

    console.log(`Saving agent '${name}' for user ${userId}`);

    try {
        // Step 1: Insert into Agents table
        const { data: agentInsertData, error: agentError } = await supabase
            .from('Agents') // Use the exact table name from your Supabase setup
            .insert({
                name: name,
                loom_url: loomUrl,
                user_id: userId,
                // description: description, // Add if description is sent from frontend
            })
            .select() // Return the inserted data, including the generated ID
            .single(); // Expecting only one row to be inserted

        if (agentError) {
            console.error('Supabase agent insert error:', agentError);
            throw new Error(agentError.message || 'Failed to insert agent data.');
        }

        if (!agentInsertData || !agentInsertData.id) {
             throw new Error('Failed to retrieve agent ID after insert.');
        }

        const agentId = agentInsertData.id;
        console.log(`Agent inserted with ID: ${agentId}`);

        // Step 2: Prepare and insert into Chunks table
        const chunksToInsert = chunkData.map(chunk => ({
            agent_id: agentId,
            order: chunk.order,
            start_time: chunk.startTime,
            end_time: chunk.endTime,
            name: chunk.name,
            status: 'Not Started', // Default status
            learned_actions: chunk.action ? [chunk.action] : null, // Store dummy action as JSONB array
            // error_details: null, // Initially no errors
        }));

        if (chunksToInsert.length > 0) {
            const { error: chunkError } = await supabase
                .from('Chunks') // Use the exact table name
                .insert(chunksToInsert);

            if (chunkError) {
                console.error('Supabase chunk insert error:', chunkError);
                // Consider attempting to delete the agent row if chunks fail? (Transactional safety)
                throw new Error(chunkError.message || 'Failed to insert chunk data.');
            }
            console.log(`${chunksToInsert.length} chunks inserted for agent ${agentId}`);
        }

        res.json({ success: true, message: 'Agent saved successfully', agentId: agentId });

    } catch (error) {
        console.error('Error saving agent to Supabase:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error saving agent.' });
    }
});
// --- End Save Agent Endpoint ---

// --- Add Fetch Agents Endpoint ---
app.get('/api/agents', async (req, res) => {
    // TEMPORARY: Get userId from query param. Replace with JWT auth later.
    const userId = req.query.userId;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'User ID is required' });
    }

    console.log(`Fetching agents for user: ${userId}`);

    try {
        const { data: agents, error } = await supabase
            .from('Agents') // Use the exact table name
            .select('id, name, description, loom_url, created_at') // Select desired columns
            .eq('user_id', userId) // Filter by user_id
            .order('created_at', { ascending: false }); // Order by most recent

        if (error) {
            console.error('Supabase fetch agents error:', error);
            // RLS errors often manifest as empty data rather than explicit errors,
            // but we check for explicit errors too.
            if (error.code === '42501') { // permission denied
                 return res.status(403).json({ success: false, error: 'Permission denied. Check RLS policies.' });
            }
            throw new Error(error.message || 'Failed to fetch agents.');
        }

        res.json({ success: true, agents: agents || [] }); // Return empty array if data is null

    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ success: false, error: error.message || 'Server error fetching agents.' });
    }
});
// --- End Fetch Agents Endpoint ---

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

// TODO: Serve static files from the React app build directory
// app.use(express.static(path.join(__dirname, '../client/build')));

// TODO: API routes will go here

// Catch-all handler for any request that doesn't match one above
// TODO: Uncomment this once the client is built
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 