const express = require('express');
const path = require('path');
const cors = require('cors');
const { chromium } = require('playwright'); // Import Playwright

const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API route to simulate Loom analysis
app.post('/api/analyze', (req, res) => {
  const { loomUrl } = req.body;

  console.log(`Received request to analyze: ${loomUrl}`);

  // --- Dummy Analysis Logic --- 
  // In a real scenario, this would involve calling Loom API, OCR, NLP etc.
  // For Milestone 3, we just return predefined chunk data.

  if (!loomUrl || !loomUrl.includes('loom.com')) {
    return res.status(400).json({ error: 'Invalid Loom URL provided' });
  }

  // Example dummy chunk data with actions
  const dummyChunks = [
    {
      id: 'chunk-1', order: 1, startTime: '0:00', endTime: '0:15', name: 'Opening Website',
      action: { type: 'goto', url: 'https://example.com' } // Dummy action
    },
    {
      id: 'chunk-2', order: 2, startTime: '0:16', endTime: '0:35', name: 'Logging In',
      action: { type: 'fill', selector: '#username', value: 'testuser' } // Dummy action
    },
    {
      id: 'chunk-3', order: 3, startTime: '0:36', endTime: '0:55', name: 'Navigating Dashboard',
      action: { type: 'click', selector: 'button.dashboard-link' } // Dummy action
    },
    {
      id: 'chunk-4', order: 4, startTime: '0:56', endTime: '1:20', name: 'Filling Form',
      action: { type: 'goto', url: 'https://google.com' } // Dummy action
    },
  ];
  // --- End Dummy Analysis Logic ---

  // Simulate some processing time
  setTimeout(() => {
     res.json({ chunks: dummyChunks });
  }, 500); // 0.5 second delay

});

// --- Add Action Execution Endpoint ---
app.post('/api/execute_action', async (req, res) => {
  const { action } = req.body;

  if (!action || !action.type) {
    return res.status(400).json({ success: false, error: 'Invalid action data provided' });
  }

  console.log('Executing action:', action);
  let browser = null; // Define browser outside try block

  try {
    // Launch browser (headed for now for visibility)
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Execute action based on type
    switch (action.type) {
      case 'goto':
        if (!action.url) throw new Error('Missing URL for goto action');
        await page.goto(action.url);
        break;
      case 'fill':
        if (!action.selector || action.value === undefined) throw new Error('Missing selector or value for fill action');
        await page.locator(action.selector).fill(action.value);
        break;
      case 'click':
        if (!action.selector) throw new Error('Missing selector for click action');
        await page.locator(action.selector).click();
        break;
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }

    // Optional: Wait a bit or take screenshot before closing
    await page.waitForTimeout(2000); // Wait 2 seconds to see the result

    console.log(`Action ${action.type} executed successfully.`);
    res.json({ success: true, message: `Successfully executed ${action.type}` });

  } catch (error) {
    console.error('Playwright action failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Playwright action failed' });
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