// This plugin will highlight the syntax of selected text in Figma

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
if (figma.command === 'auto-syntax') {
  // For auto command, don't show UI and apply syntax immediately
  const selection = figma.currentPage.selection;
  const textNodes = selection.filter(node => node.type === 'TEXT');

  if (textNodes.length > 0) {
    // Get settings or use defaults
    figma.clientStorage.getAsync('pluginSettings').then(settings => {
      const theme = settings?.theme || 'light-plus';
      const language = settings?.language || 'python';
      const includeBg = settings?.includeBg || false;

      // Show UI temporarily to process the syntax highlighting
      figma.showUI(__html__, { visible: false });

      // Send all nodes to be processed
      figma.ui.postMessage({
        type: 'process-nodes',
        nodes: textNodes.map(node => ({
          content: node.characters,
          language: node.characters.match(/^\$([\w-]+)/)?.[1]?.toLowerCase() || language
        })),
        settings: { theme, language, includeBg }
      });
    });
  } else {
    figma.notify('Please select at least one text layer');
    figma.closePlugin();
  }
} else {
  // For manual command, show UI as normal
  figma.showUI(__html__, { width: 600, height: 500 });
}

function checkSelection() {
  const selection = figma.currentPage.selection;
  const textNodes = selection.filter(node => node.type === 'TEXT');

  if (textNodes.length > 0) {
    // Get the code from the first text node to display in UI
    const firstTextNode = textNodes[0] as TextNode;
    const code = firstTextNode.characters;

    // Check if the code starts with a language declaration
    const languageMatch = code.match(/^\$([\w-]+)/);
    const language = languageMatch ? languageMatch[1].toLowerCase() : null;

    figma.ui.postMessage({
      type: 'code',
      content: code,
      language: language,
      selectionCount: textNodes.length
    });
  } else {
    figma.ui.postMessage({ type: 'no-selection' });
  }
}

// Check selection when the plugin starts
if (figma.command !== 'auto-syntax') {
  checkSelection();
}

figma.on('selectionchange', () => {
  if (figma.command !== 'auto-syntax') {
    checkSelection();
  }
});

figma.ui.onmessage = async (msg: {
  type: string;
  colorData?: Array<{ text: string, color: string }>;
  backgroundColor?: string;
  hasLanguageDeclaration?: boolean;
  includeBg?: boolean;
  theme?: string;
  language?: string;
  settings?: {theme: string, language: string, includeBg: boolean};
  processedNodes?: Array<{
    colorData: Array<{ text: string, color: string }>;
    hasLanguageDeclaration: boolean;
  }>;
}) => {
  if (msg.type === 'init') {
    if (figma.command !== 'auto-syntax') {
      checkSelection();
    }
  } else if (msg.type === 'applyDetailedColors' && msg.colorData) {
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');

    if (textNodes.length > 0) {
      // Get current settings
      const settings = await figma.clientStorage.getAsync('pluginSettings') || {
        theme: 'light-plus',
        language: 'python',
        includeBg: false
      };

      // Process all nodes at once using the same approach as auto mode
      figma.ui.postMessage({
        type: 'process-nodes',
        nodes: textNodes.map(node => ({
          content: node.characters,
          language: node.characters.match(/^\$([\w-]+)/)?.[1]?.toLowerCase() || settings.language
        })),
        settings
      });
    } else {
      figma.notify('Please select at least one text layer');
    }
  } else if (msg.type === 'processedNodes' && msg.processedNodes) {
    // Process multiple nodes (auto mode)
    const selection = figma.currentPage.selection;
    const textNodes = selection.filter(node => node.type === 'TEXT');

    for (let i = 0; i < textNodes.length; i++) {
      const nodeData = msg.processedNodes[i];
      if (nodeData) {
        await applyColorsToNode(
          textNodes[i],
          nodeData.colorData,
          nodeData.hasLanguageDeclaration,
          msg.includeBg || false,
          msg.backgroundColor
        );
      }
    }

    figma.notify(`Updated ${textNodes.length} text ${textNodes.length === 1 ? 'layer' : 'layers'}`);
    if (figma.command === 'auto-syntax') {
      figma.closePlugin();
    }
  } else if (msg.type === 'themeChanged' && msg.theme) {
    console.log('Theme changed to:', msg.theme);
  } else if (msg.type === 'saveSettings' && msg.settings) {
    await figma.clientStorage.setAsync('pluginSettings', msg.settings);
  }
};

async function applyColorsToNode(
  textNode: TextNode,
  colorData: Array<{ text: string, color: string }>,
  hasLanguageDeclaration: boolean,
  includeBg: boolean,
  backgroundColor?: string
) {
  let frame: FrameNode | null = null;
  if (includeBg) {
    // Check if the text node is already in a frame
    if (textNode.parent && textNode.parent.type === 'FRAME') {
      frame = textNode.parent as FrameNode;
    } else {
      // Create a new frame with auto layout
      frame = figma.createFrame();
      frame.resize(textNode.width, textNode.height);
      frame.x = textNode.x;
      frame.y = textNode.y;
      frame.layoutMode = 'VERTICAL';
      frame.primaryAxisSizingMode = 'AUTO';
      frame.counterAxisSizingMode = 'AUTO';
      frame.itemSpacing = 0;
      frame.paddingLeft = 20;
      frame.paddingRight = 20;
      frame.paddingTop = 20;
      frame.paddingBottom = 20;
      if (textNode.parent) {
        textNode.parent.appendChild(frame);
      }
      frame.appendChild(textNode);
    }

    // Apply background color to the frame
    if (backgroundColor) {
      const bgColor = figma.util.rgb(backgroundColor);
      frame.fills = [{ type: 'SOLID', color: bgColor }];
    }
  } else if (textNode.parent && textNode.parent.type === 'FRAME') {
    // If includeBg is false and the text is in a frame, don't update the bg
    frame = textNode.parent as FrameNode;
  }

  // Apply text colors
  let currentIndex = 0;
  if (hasLanguageDeclaration) {
    currentIndex = textNode.characters.indexOf('\n') + 1;
    textNode.setRangeFills(0, currentIndex, [{ type: 'SOLID', color: {r: 0, g: 0, b: 0} }]);
  }
  colorData.forEach(({ text, color }) => {
    const endIndex = currentIndex + text.length;
    const textColor = figma.util.rgb(color);
    textNode.setRangeFills(currentIndex, endIndex, [{ type: 'SOLID', color: textColor }]);
    currentIndex = endIndex;
  });
}

figma.clientStorage.getAsync('pluginSettings').then(settings => {
  if (settings) {
    figma.ui.postMessage({
      type: 'loadSettings',
      settings: settings
    });
  }
});
