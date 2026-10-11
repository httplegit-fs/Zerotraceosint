const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, isMaskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#020d06';
  ctx.fillRect(0, 0, size, size);

  // Safe zone calculation
  const padding = isMaskable ? size * 0.15 : size * 0.05;
  const contentSize = size - (padding * 2);

  // Draw some cyber-ish logo (circle with inner circle and text)
  ctx.strokeStyle = '#00ffd5';
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(size/2, size/2, contentSize/2.5, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = '#c8ff00';
  ctx.beginPath();
  ctx.arc(size/2, size/2, contentSize/4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#020d06';
  ctx.font = `bold ${size * 0.15}px Courier`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ZT', size/2, size/2);

  return canvas.toBuffer('image/png');
}

fs.writeFileSync('public/pwa-192x192.png', generateIcon(192));
fs.writeFileSync('public/pwa-512x512.png', generateIcon(512));
fs.writeFileSync('public/pwa-maskable-512x512.png', generateIcon(512, true));
fs.writeFileSync('public/apple-touch-icon.png', generateIcon(180));
