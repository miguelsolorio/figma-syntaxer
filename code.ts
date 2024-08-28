// This plugin will highlight the syntax of selected text in Figma

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 800, height: 500 });

function checkSelection() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === 'TEXT') {
    const textNode = selection[0] as TextNode;
    const code = textNode.characters;
    figma.ui.postMessage({ type: 'code', content: code });
  } else {
    figma.ui.postMessage({ type: 'no-selection' });
  }
}

// Check selection when the plugin starts
checkSelection();

figma.on('selectionchange', checkSelection);

figma.ui.onmessage = (msg: { 
  type: string; 
  colorData?: Array<{ text: string, color: string }>;
  backgroundColor?: string;
}) => {
  if (msg.type === 'init') {
    checkSelection();
  } else if (msg.type === 'applyDetailedColors' && msg.colorData && msg.backgroundColor) {
    const selection = figma.currentPage.selection;
    if (selection.length === 1 && selection[0].type === 'TEXT') {
      const textNode = selection[0] as TextNode;
      
      // Apply background color
      const bgColor = figma.util.rgb(msg.backgroundColor);
      textNode.fills = [{ type: 'SOLID', color: bgColor }];
      
      // Apply text colors
      let currentIndex = 0;
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
  }
};
