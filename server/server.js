const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

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