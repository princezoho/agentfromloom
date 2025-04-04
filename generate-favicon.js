const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Create a canvas
const size = 64;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Fill the background with a gradient
const gradient = ctx.createLinearGradient(0, 0, size, size);
gradient.addColorStop(0, '#3ECF8E'); // Supabase green
gradient.addColorStop(1, '#00C4EB'); // Blue

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, size, size);

// Add text
ctx.fillStyle = 'white';
ctx.font = 'bold 28px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('AFL', size / 2, size / 2);

// Draw a subtle border
ctx.strokeStyle = 'rgba(255,255,255,0.5)';
ctx.lineWidth = 2;
ctx.strokeRect(3, 3, size - 6, size - 6);

// Write to PNG file
const outputPath = path.join(__dirname, 'client', 'public', 'favicon.ico');
const stream = fs.createWriteStream(outputPath);
const pngStream = canvas.createPNGStream();
pngStream.pipe(stream);

stream.on('finish', () => {
  console.log('Custom favicon created at:', outputPath);
}); 