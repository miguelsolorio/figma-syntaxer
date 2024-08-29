// This plugin will highlight the syntax of selected text in Figma

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 600, height: 500 });

function checkSelection() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === 'TEXT') {
    const textNode = selection[0] as TextNode;
    const code = textNode.characters;
    
    // Check if the code starts with a language declaration
    const languageMatch = code.match(/^\$([\w-]+)/);
    const language = languageMatch ? languageMatch[1].toLowerCase() : null;
    
    figma.ui.postMessage({ 
      type: 'code', 
      content: code,
      language: language
    });
  } else {
    figma.ui.postMessage({ type: 'no-selection' });
  }
}

// Check selection when the plugin starts
checkSelection();

figma.on('selectionchange', checkSelection);

figma.ui.onmessage = async (msg: { 
  type: string; 
  colorData?: Array<{ text: string, color: string }>;
  backgroundColor?: string;
  hasLanguageDeclaration?: boolean;
  theme?: string;
}) => {
  if (msg.type === 'init') {
    checkSelection();
  } else if (msg.type === 'applyDetailedColors' && msg.colorData && msg.backgroundColor) {
    const selection = figma.currentPage.selection;
    if (selection.length === 1 && selection[0].type === 'TEXT') {
      const textNode = selection[0] as TextNode;
      
      // Check if the text node is already in a frame
      let frame: FrameNode;
      if (textNode.parent && textNode.parent.type === 'FRAME') {
        frame = textNode.parent as FrameNode;
      } else {
        // Create a new frame with auto layout
        frame = figma.createFrame();
        frame.resize(textNode.width, textNode.height);
        frame.x = textNode.x;
        frame.y = textNode.y;
        if (textNode.parent) {
          textNode.parent.appendChild(frame);
        }
        frame.appendChild(textNode);
        frame.layoutMode = 'VERTICAL';
        frame.primaryAxisSizingMode = 'AUTO';
        frame.counterAxisSizingMode = 'AUTO';
        frame.itemSpacing = 0;
        frame.paddingLeft = 20;
        frame.paddingRight = 20;
        frame.paddingTop = 20;
        frame.paddingBottom = 20;
      }

      // Apply background color to the frame
      const bgColor = figma.util.rgb(msg.backgroundColor);
      frame.fills = [{ type: 'SOLID', color: bgColor }];
      console.log(msg);
      console.log(`Frame created with background color: ${msg.backgroundColor}`);
      
      // Apply text colors
      let currentIndex = 0;
      if (msg.hasLanguageDeclaration) {
        currentIndex = textNode.characters.indexOf('\n') + 1;
        textNode.setRangeFills(0, currentIndex, [{ type: 'SOLID', color: {r: 0, g: 0, b: 0} }]);
      }
      msg.colorData.forEach(({ text, color }) => {
        const endIndex = currentIndex + text.length;
        const textColor = figma.util.rgb(color);
        textNode.setRangeFills(currentIndex, endIndex, [{ type: 'SOLID', color: textColor }]);
        currentIndex = endIndex;
      });
      
      figma.notify('Colors applied successfully!');
    } else {
      figma.notify('Please select a single text layer');
    }
  } else if (msg.type === 'themeChanged' && msg.theme) {
    console.log('Theme changed to:', msg.theme);
  }
};
