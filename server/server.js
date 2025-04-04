const express = require('express');
const path = require('path');
const cors = require('cors');

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

  // Example dummy chunk data
  const dummyChunks = [
    { id: 'chunk-1', order: 1, startTime: '0:00', endTime: '0:15', name: 'Opening Website' },
    { id: 'chunk-2', order: 2, startTime: '0:16', endTime: '0:35', name: 'Logging In' },
    { id: 'chunk-3', order: 3, startTime: '0:36', endTime: '0:55', name: 'Navigating Dashboard' },
    { id: 'chunk-4', order: 4, startTime: '0:56', endTime: '1:20', name: 'Filling Form' },
  ];
  // --- End Dummy Analysis Logic ---

  // Simulate some processing time
  setTimeout(() => {
     res.json({ chunks: dummyChunks });
  }, 500); // 0.5 second delay

});

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