// Shiki Loader - Handles loading and initializing the Shiki syntax highlighter

// Theme registry to store registered themes
const themeRegistry = {};

// Register a theme for use with Shiki
window.registerTheme = function(name, data) {
  themeRegistry[name] = data;
};

// Cache for initialized highlighters
const highlighterCache = {};

// Initialize Shiki once and cache the instance
let shikiInitPromise = null;

/**
 * Gets a properly initialized Shiki highlighter
 * @returns {Promise<object>} The initialized Shiki highlighter
 */
window.getShikiHighlighter = async function() {
  // Initialize and cache Shiki instance if not already done
  if (!shikiInitPromise) {
    shikiInitPromise = initializeShiki();
  }

  try {
    return await shikiInitPromise;
  } catch (error) {
    console.error('Failed to initialize Shiki:', error);
    return createFallbackHighlighter();
  }
};

/**
 * Initialize the Shiki highlighter with the current theme
 * @returns {Promise<object>} The initialized highlighter
 */
async function initializeShiki() {
  try {
    // Check if window.shiki exists and has the getHighlighter function
    if (!window.shiki || typeof window.shiki.getHighlighter !== 'function') {
      throw new Error('Shiki library not available');
    }

    // Get the current theme selection
    const themeSelection = document.getElementById('theme-dropdown').value;

    // Get theme data from registry
    const themeData = themeRegistry[themeSelection] || themeSelection;

    // Create the highlighter
    const highlighter = await window.shiki.getHighlighter({
      theme: themeData,
      langs: [
        'javascript', 'typescript', 'jsx', 'tsx', 'html', 'css',
        'python', 'java', 'c', 'cpp', 'csharp', 'php', 'ruby',
        'rust', 'go', 'swift', 'sql', 'bash', 'shell',
        'json', 'yaml', 'xml', 'markdown'
      ],
    });

    return highlighter;
  } catch (error) {
    console.warn('Error initializing Shiki highlighter:', error);
    throw error;
  }
}

/**
 * Creates a basic fallback highlighter when Shiki fails to load
 * @returns {object} A fallback object with Shiki-compatible API
 */
function createFallbackHighlighter() {
  return {
    codeToHtml: function(code, options) {
      const lang = options?.lang || 'plaintext';
      const isDarkTheme = document.getElementById('theme-dropdown').value.includes('dark');

      // Basic HTML escaping
      let escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Simple syntax highlighting based on language
      if (['javascript', 'typescript', 'jsx', 'tsx'].includes(lang)) {
        // Keywords
        escapedCode = escapedCode.replace(
          /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g,
          '<span style="color: ' + (isDarkTheme ? '#569CD6' : '#0000ff') + ';">$1</span>'
        );

        // Strings
        escapedCode = escapedCode.replace(
          /(".*?"|'.*?'|`.*?`)/g,
          '<span style="color: ' + (isDarkTheme ? '#CE9178' : '#a31515') + ';">$1</span>'
        );

        // Comments
        escapedCode = escapedCode.replace(
          /\/\/.*$/gm,
          '<span style="color: ' + (isDarkTheme ? '#6A9955' : '#008000') + ';">$&</span>'
        );

        // Numbers
        escapedCode = escapedCode.replace(
          /\b(\d+)\b/g,
          '<span style="color: ' + (isDarkTheme ? '#B5CEA8' : '#098658') + ';">$1</span>'
        );
      }
      else if (['html', 'xml'].includes(lang)) {
        // Tags
        escapedCode = escapedCode.replace(
          /(&lt;\/?\w+)(\s.*?)?(&gt;)/g,
          '<span style="color: ' + (isDarkTheme ? '#569CD6' : '#800000') + ';">$1</span>$2<span style="color: ' + (isDarkTheme ? '#569CD6' : '#800000') + ';">$3</span>'
        );

        // Attributes
        escapedCode = escapedCode.replace(
          /(\s+)(\w+)(=)/g,
          '$1<span style="color: ' + (isDarkTheme ? '#9CDCFE' : '#ff0000') + ';">$2</span>$3'
        );

        // Strings
        escapedCode = escapedCode.replace(
          /(".*?"|'.*?')/g,
          '<span style="color: ' + (isDarkTheme ? '#CE9178' : '#a31515') + ';">$1</span>'
        );
      }
      else if (lang === 'python') {
        // Keywords
        escapedCode = escapedCode.replace(
          /\b(def|class|import|from|return|if|else|for|while|with|as|try|except|finally)\b/g,
          '<span style="color: ' + (isDarkTheme ? '#569CD6' : '#0000ff') + ';">$1</span>'
        );

        // Strings
        escapedCode = escapedCode.replace(
          /(".*?"|'.*?')/g,
          '<span style="color: ' + (isDarkTheme ? '#CE9178' : '#a31515') + ';">$1</span>'
        );

        // Comments
        escapedCode = escapedCode.replace(
          /#.*$/gm,
          '<span style="color: ' + (isDarkTheme ? '#6A9955' : '#008000') + ';">$&</span>'
        );

        // Numbers
        escapedCode = escapedCode.replace(
          /\b(\d+)\b/g,
          '<span style="color: ' + (isDarkTheme ? '#B5CEA8' : '#098658') + ';">$1</span>'
        );
      }

      // Get background based on theme
      const bgColor = isDarkTheme ? '#1e1e1e' : '#ffffff';

      // Return HTML with proper styling
      return `<pre class="shiki" style="background-color: ${bgColor}; color: ${isDarkTheme ? '#d4d4d4' : '#000000'};"><code>${escapedCode}</code></pre>`;
    }
  };
}