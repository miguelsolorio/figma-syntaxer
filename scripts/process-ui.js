/**
 * Script to process UI.html and inject theme scripts
 * Run with: node scripts/process-ui.js
 */

const fs = require('fs');
const path = require('path');

// List of themes (should match themes downloaded by download-themes.js)
const themes = [
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

// Path to UI HTML file
const uiPath = path.resolve(__dirname, '../ui.html');

// Read the UI HTML file
let uiContent = fs.readFileSync(uiPath, 'utf8');

// Generate script tags for each theme - using simplified format
const themeScripts = themes.map(theme => 
  `  <script>registerTheme('${theme}', {name: '${theme}'});</script>`
).join('\n');

// Replace the placeholder with the theme scripts
uiContent = uiContent.replace(/<!-- THEME_SCRIPTS_PLACEHOLDER -->.*/, themeScripts);

// Write the processed UI HTML file
fs.writeFileSync(uiPath, uiContent);

console.log('✅ UI.html processed successfully with theme scripts');

// Now generate individual theme JS files
const themesDir = path.resolve(__dirname, '../utils/themes');
if (!fs.existsSync(themesDir)) {
  fs.mkdirSync(themesDir, { recursive: true });
}

for (const theme of themes) {
  const themeJsonPath = path.join(themesDir, `${theme}.json`);
  const themeJsPath = path.join(themesDir, `${theme}.js`);
  
  // Check if JSON file exists
  if (fs.existsSync(themeJsonPath)) {
    // Read the theme JSON
    const themeData = fs.readFileSync(themeJsonPath, 'utf8');
    
    // Create JS file that registers the theme
    const themeJsContent = `// Theme data for ${theme}\nregisterTheme('${theme}', ${themeData});\n`;
    
    // Write the theme JS file
    fs.writeFileSync(themeJsPath, themeJsContent);
    console.log(`Generated ${theme}.js`);
  } else {
    console.warn(`❌ Theme JSON file not found: ${themeJsonPath}`);
  }
}

console.log('✅ Theme JS files generated successfully');