/**
 * Script to download Shiki themes and store them locally
 * Run with: node scripts/download-themes.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// This list should match the themes in the UI.html dropdown
const themesToDownload = [
  // Light themes
  'light-plus',
  'github-light',
  'material-theme-lighter',
  'min-light',
  'rose-pine-dawn',
  'solarized-light',
  'vitesse-light',
  
  // Dark themes
  'dark-plus',
  'dracula',
  'dracula-soft',
  'github-dark',
  'github-dark-dimmed',
  'material-theme',
  'material-theme-darker',
  'material-theme-ocean',
  'material-theme-palenight',
  'min-dark',
  'monokai',
  'nord',
  'one-dark-pro',
  'poimandres',
  'rose-pine',
  'rose-pine-moon',
  'slack-dark',
  'slack-ochin',
  'solarized-dark',
  'vitesse-black',
  'vitesse-dark'
];

// Create output directory
const outputDir = path.resolve(__dirname, '../utils/themes');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

// Download each theme
async function downloadThemes() {
  console.log('Downloading Shiki themes...');
  
  try {
    for (const theme of themesToDownload) {
      const themeUrl = `https://cdn.jsdelivr.net/npm/shiki@0.14.7/themes/${theme}.json`;
      const outputPath = path.join(outputDir, `${theme}.json`);
      
      console.log(`Downloading ${theme}...`);
      await downloadFile(themeUrl, outputPath);
    }

    // We're not creating the themes.js file anymore since we're using our minimal implementation
    
    console.log('✅ All themes downloaded successfully!');
    console.log(`Themes saved to: ${outputDir}`);
  } catch (error) {
    console.error('Error downloading themes:', error);
    process.exit(1);
  }
}

downloadThemes();