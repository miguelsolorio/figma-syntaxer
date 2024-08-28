// This plugin will highlight the syntax of selected text in Figma

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 300, height: 300 }); // Fixed height, initial width

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

figma.ui.onmessage = (msg: { type: string; width?: number }) => {
  if (msg.type === 'init') {
    // Instead of calling a non-existent function, we'll check the selection again
    checkSelection();
  } else if (msg.type === 'resize') {
    // Resize the plugin window based on the content width
    figma.ui.resize(msg.width || 300, 300);
  }
};
