const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Create a canvas
const size = 64;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Fill the background with Supabase dark color
ctx.fillStyle = '#1e1e1e';
ctx.fillRect(0, 0, size, size);

// Draw the Supabase-like logo (a simplified version)
ctx.fillStyle = '#3ECF8E'; // Supabase green
ctx.beginPath();
// Draw a triangle shape resembling Supabase logo
ctx.moveTo(size * 0.3, size * 0.2);
ctx.lineTo(size * 0.7, size * 0.2);
ctx.lineTo(size * 0.5, size * 0.8);
ctx.closePath();
ctx.fill();

// Add "SB" text
ctx.fillStyle = 'white';
ctx.font = 'bold 16px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('SB', size / 2, size * 0.85);

// Write to PNG file
const outputPath = path.join(__dirname, 'supabase-assets', 'favicon.ico');
const stream = fs.createWriteStream(outputPath);
const pngStream = canvas.createPNGStream();
pngStream.pipe(stream);

stream.on('finish', () => {
  console.log('Supabase favicon created at:', outputPath);
}); 