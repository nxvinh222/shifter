const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Function to create a basic SVG icon
function createSvgIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4285f4"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#ffffff"/>
  <text x="${size/2}" y="${size/1.8}" font-family="Arial" font-size="${size/3}" fill="#4285f4" text-anchor="middle">S</text>
</svg>`;
}

// Generate different icon sizes
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const iconPath = path.join(distDir, `icon${size}.png`);
  // For simplicity, we're just creating SVG files
  // In a real extension, you'd convert these to PNG
  fs.writeFileSync(iconPath.replace('.png', '.svg'), createSvgIcon(size));
  console.log(`Created ${iconPath.replace('.png', '.svg')}`);
});

// Copy SVG files for development purposes only
// Chrome requires PNG for production, but SVG is easier for this demo
sizes.forEach(size => {
  const svgPath = path.join(distDir, `icon${size}.svg`);
  const pngPath = path.join(distDir, `icon${size}.png`);
  if (fs.existsSync(svgPath)) {
    fs.copyFileSync(svgPath, pngPath);
    console.log(`Copied ${svgPath} to ${pngPath} (placeholder for real PNG)`);
  }
}); 