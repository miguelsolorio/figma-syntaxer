/**
 * Super minimal syntax highlighter for Figma Syntaxer plugin
 * No external dependencies, no network requests
 */

// Create global objects immediately to ensure they're defined
window.shiki = {};
window.registerTheme = function() {};

(function() {
  // The minimal implementation of Shiki's API
  window.shiki.getHighlighter = async function() {
    return {
      codeToHtml: function(code, options) {
        const lang = options?.lang || 'plaintext';
        
        // Escape HTML
        let escapedCode = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
          
        // Basic syntax highlighting for common languages
        if (lang === 'javascript' || lang === 'typescript' || lang === 'jsx' || lang === 'tsx') {
          escapedCode = escapedCode
            .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from)\b/g, 
              '<span style="color: blue;">$1</span>')
            .replace(/(".*?"|'.*?'|`.*?`)/g, 
              '<span style="color: #a31515;">$1</span>')
            .replace(/\/\/.*$/gm, 
              '<span style="color: green;">$&</span>')
            .replace(/\b(\d+)\b/g, 
              '<span style="color: #098658;">$1</span>');
        }
        else if (lang === 'python') {
          escapedCode = escapedCode
            .replace(/\b(def|class|import|from|return|if|else|for|while|with|as)\b/g, 
              '<span style="color: blue;">$1</span>')
            .replace(/(".*?"|'.*?')/g, 
              '<span style="color: #a31515;">$1</span>')
            .replace(/#.*$/gm, 
              '<span style="color: green;">$&</span>')
            .replace(/\b(\d+)\b/g, 
              '<span style="color: #098658;">$1</span>');
        }
        
        // Return HTML with minimal styling
        return `<pre class="shiki" style="background-color: white;"><code>${escapedCode}</code></pre>`;
      }
    };
  };
})();