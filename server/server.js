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