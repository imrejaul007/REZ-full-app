/**
 * Icon Generator Script
 *
 * Run with: node scripts/generate-icons.js
 *
 * Requires: sharp (npm install sharp)
 *
 * Converts SVG icons to PNG for PWA compatibility.
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp is not installed.');
  console.error('Run: npm install sharp');
  console.error('');
  console.error('Alternatively, use ImageMagick:');
  console.error('  brew install imagemagick  # macOS');
  console.error('  convert public/icons/icon-192.svg icon-192.png');
  process.exit(1);
}

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon configurations
const icons = [
  { name: 'icon-192.png', svg: 'icon-192.svg', size: 192 },
  { name: 'icon-512.png', svg: 'icon-512.svg', size: 512 },
  { name: 'icon-180.png', svg: 'icon-192.svg', size: 180 }, // iOS
  { name: 'icon-167.png', svg: 'icon-192.svg', size: 167 }, // iPad Pro
  { name: 'icon-152.png', svg: 'icon-192.svg', size: 152 }, // iPad
  { name: 'icon-120.png', svg: 'icon-192.svg', size: 120 }, // iPhone
];

async function generateIcons() {
  console.log('Generating PNG icons from SVG...\n');

  for (const icon of icons) {
    const svgPath = path.join(iconsDir, icon.svg);
    const pngPath = path.join(iconsDir, icon.name);

    if (!fs.existsSync(svgPath)) {
      console.warn(`  Warning: ${icon.svg} not found, skipping ${icon.name}`);
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(pngPath);
      console.log(`  Created: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`  Error creating ${icon.name}: ${error.message}`);
    }
  }

  console.log('\nPNG icons generated successfully!');
  console.log('Location: public/icons/');
}

// Run the generator
generateIcons().catch(console.error);
