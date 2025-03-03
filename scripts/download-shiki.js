/**
 * Script to download Shiki library for local bundling
 * Run with: node scripts/download-shiki.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Latest version of Shiki
const SHIKI_URL = 'https://unpkg.com/shiki@0.14.7/dist/index.unpkg.iife.js';
const OUTPUT_PATH = path.resolve(__dirname, '../utils/shiki.js');

/**
 * Download a file from a URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlinkSync(outputPath);
      reject(err);
    });
  });
}

async function downloadShiki() {
  console.log('Downloading Shiki library...');
  
  try {
    await downloadFile(SHIKI_URL, OUTPUT_PATH);
    console.log(`✅ Shiki library downloaded to: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error downloading Shiki:', error);
    process.exit(1);
  }
}

downloadShiki();