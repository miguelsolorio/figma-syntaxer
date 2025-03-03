/**
 * Minimal Shiki implementation for Figma Syntaxer
 * 
 * This provides a subset of the Shiki API without external dependencies
 */

// Create global shiki object
// Create the Shiki global immediately to avoid race conditions
window.shiki = {};

(function() {
  // Store registered themes
  const registeredThemes = {};
  
  /**
   * Register a theme for use with the highlighter
   */
  function registerTheme(themeName, themeData) {
    registeredThemes[themeName] = themeData;
  }
  
  // Assign to global
  window.registerTheme = registerTheme;
  
  /**
   * Simple language-based color mapping for fallback highlighting
   */
  const languageTokenColors = {
    // Default colors for common tokens across languages
    string: '#a31515',       // Strings (red)
    comment: '#008000',      // Comments (green)
    keyword: '#0000ff',      // Keywords (blue)
    number: '#098658',       // Numbers (dark green)
    function: '#795e26',     // Functions (brown)
    operator: '#000000',     // Operators (black)
    variable: '#001080',     // Variables (dark blue)
    property: '#001080',     // Properties (dark blue)
    punctuation: '#000000',  // Punctuation (black)
    
    // Language-specific fallback colors
    javascript: {
      'const': '#0000ff',
      'let': '#0000ff',
      'var': '#0000ff',
      'function': '#0000ff',
      'return': '#0000ff',
      'if': '#0000ff',
      'else': '#0000ff'
    },
    
    python: {
      'def': '#0000ff',
      'class': '#0000ff',
      'import': '#0000ff',
      'from': '#0000ff',
      'return': '#0000ff',
      'if': '#0000ff',
      'else': '#0000ff'
    },
    
    html: {
      tag: '#800000',
      attribute: '#ff0000',
      value: '#0000ff'
    }
  };
  
  /**
   * Simplistic token-based syntax highlighter
   */
  function highlightTokens(code, language) {
    // Escape HTML
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Super basic syntax highlighting for common elements
    let coloredCode = escapedCode;
    
    // Apply basic color rules based on language
    if (language === 'javascript' || language === 'typescript') {
      // Keywords
      coloredCode = coloredCode.replace(
        /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g, 
        '<span style="color: #0000ff;">$1</span>'
      );
      
      // Strings
      coloredCode = coloredCode.replace(
        /(".*?"|'.*?'|`.*?`)/g, 
        '<span style="color: #a31515;">$1</span>'
      );
      
      // Numbers
      coloredCode = coloredCode.replace(
        /\b(\d+)\b/g, 
        '<span style="color: #098658;">$1</span>'
      );
      
      // Comments
      coloredCode = coloredCode.replace(
        /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, 
        '<span style="color: #008000;">$1</span>'
      );
    } 
    else if (language === 'python') {
      // Keywords
      coloredCode = coloredCode.replace(
        /\b(def|class|import|from|return|if|else|for|while|with|as|try|except|finally)\b/g, 
        '<span style="color: #0000ff;">$1</span>'
      );
      
      // Strings
      coloredCode = coloredCode.replace(
        /(".*?"|'.*?'|"""[\s\S]*?"""|'''[\s\S]*?''')/g, 
        '<span style="color: #a31515;">$1</span>'
      );
      
      // Numbers
      coloredCode = coloredCode.replace(
        /\b(\d+)\b/g, 
        '<span style="color: #098658;">$1</span>'
      );
      
      // Comments
      coloredCode = coloredCode.replace(
        /(#.*$)/gm, 
        '<span style="color: #008000;">$1</span>'
      );
    }
    
    return `<pre class="shiki" style="background-color: #ffffff"><code>${coloredCode}</code></pre>`;
  }
  
  /**
   * Get a Shiki highlighter - guaranteed to work
   */
  async function getHighlighter(options) {
    const theme = options?.theme || 'light-plus';
    const langs = options?.langs || ['plaintext'];
    
    // Just return the highlighter right away - no async loading
    return {
      /**
       * Convert code to HTML with syntax highlighting
       */
      codeToHtml: function(code, options) {
        try {
          const lang = options?.lang || 'plaintext';
          return highlightTokens(code, lang);
        } catch (err) {
          console.error('Error in code highlighting:', err);
          // Basic fallback if something goes wrong
          const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<pre class="shiki"><code>${escapedCode}</code></pre>`;
        }
      }
    };
  }
  
  // Extend the global shiki object with our implementation
  Object.assign(window.shiki, {
    getHighlighter,
    registerTheme,
    BUNDLED_THEMES: registeredThemes,
    BUNDLED_THEMES_MAP: {}
  });
})();