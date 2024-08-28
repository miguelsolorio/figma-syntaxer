// This plugin will highlight the syntax of selected text in Figma

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 300, height: 400 });

function sendSelectedTextToUI() {
  const selection = figma.currentPage.selection;
  if (selection.length === 1 && selection[0].type === 'TEXT') {
    const textNode = selection[0] as TextNode;
    const code = textNode.characters;
    figma.ui.postMessage({ type: 'code', content: code });
  } else {
    figma.ui.postMessage({ type: 'no-selection' });
  }
}

figma.on('selectionchange', sendSelectedTextToUI);

figma.ui.onmessage = (msg: { type: string }) => {
  if (msg.type === 'init') {
    sendSelectedTextToUI();
  }
};
