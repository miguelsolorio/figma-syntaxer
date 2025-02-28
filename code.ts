// Figma Syntaxer - A plugin for syntax highlighting of code in Figma text layers

// Type definitions for better code organization
interface SyntaxerSettings {
  theme: string;
  language: string;
  includeBg: boolean;
}

interface TextNodeContent {
  content: string;
  language: string;
}

interface ColorData {
  text: string;
  color: string;
}

interface ProcessedNodeData {
  colorData: ColorData[];
  hasLanguageDeclaration: boolean;
}

interface UIMessage {
  type: string;
  colorData?: ColorData[];
  backgroundColor?: string;
  hasLanguageDeclaration?: boolean;
  includeBg?: boolean;
  theme?: string;
  language?: string;
  settings?: SyntaxerSettings;
  processedNodes?: ProcessedNodeData[];
  content?: string;
  selectionCount?: number;
  autoRun?: boolean;
  nodes?: TextNodeContent[];
}

// Default settings
const DEFAULT_SETTINGS: SyntaxerSettings = {
  theme: 'light-plus',
  language: 'python',
  includeBg: false
};

// Language detection regex
const LANGUAGE_DECLARATION_REGEX = /^\$([\w-]+)/;

// Common language patterns for auto-detection
const LANGUAGE_PATTERNS = [
  { language: 'javascript', patterns: [/const\s+\w+\s*=/, /function\s+\w+\s*\(/, /export\s+(?:default|const)/, /import\s+.*\s+from/, /^\s*\/\//, /^\s*console\.log\(/] },
  { language: 'typescript', patterns: [/:\s*(?:string|number|boolean|any)\s*[,=)]/, /interface\s+\w+/, /class\s+\w+\s+implements/, /<.*>\(.*\)/, /import\s+{.*}\s+from/] },
  { language: 'html', patterns: [/<html/, /<div/, /<body/, /<script/, /<head/, /<img/, /<a\s+href/] },
  { language: 'css', patterns: [/\s*{[\s\S]*?}/, /\s*:\s*.*;/, /@media/, /#[\w-]+\s*{/, /\.[\w-]+\s*{/] },
  { language: 'python', patterns: [/def\s+\w+\s*\(.*\):/, /import\s+[\w.]+/, /from\s+[\w.]+\s+import/, /class\s+\w+/, /if\s+.*:/, /^\s*#.*/, /print\(/] },
  { language: 'java', patterns: [/public\s+(?:class|void|static)/, /private\s+\w+/, /protected\s+\w+/, /class\s+\w+\s+(?:extends|implements)/, /import\s+java.*/] },
  { language: 'c', patterns: [/#include\s+<.*>/, /int\s+main\s*\(\s*(?:void|int argc, char \*\*argv)\s*\)/, /printf\(/] },
  { language: 'cpp', patterns: [/#include\s+<.*>/, /std::\w+/, /namespace\s+\w+/, /template\s*<.*>/] },
  { language: 'csharp', patterns: [/using\s+System;/, /namespace\s+\w+/, /public\s+class\s+\w+/, /\w+\s*:\s*\w+Class/] },
  { language: 'php', patterns: [/<\?php/, /\$\w+\s*=/, /function\s+\w+\s*\(/, /echo\s+/] },
  { language: 'ruby', patterns: [/def\s+\w+/, /require\s+['"].*['"]/, /class\s+\w+\s+</, /@\w+/, /puts\s+/] },
  { language: 'rust', patterns: [/fn\s+\w+/, /let\s+mut/, /use\s+std::/, /struct\s+\w+/, /impl\s+\w+/] },
  { language: 'go', patterns: [/func\s+\w+/, /package\s+\w+/, /import\s+\(/, /type\s+\w+\s+struct/] },
  { language: 'swift', patterns: [/import\s+\w+/, /func\s+\w+/, /var\s+\w+\s*:\s*\w+/, /class\s+\w+\s*{/, /let\s+\w+\s*=/] },
  { language: 'sql', patterns: [/SELECT\s+.*\s+FROM/, /INSERT\s+INTO/, /UPDATE\s+.*\s+SET/, /CREATE\s+TABLE/, /ALTER\s+TABLE/i] },
  { language: 'json', patterns: [/^\s*{[\s\S]*".*"\s*:[\s\S]*}$/, /^\s*\[[\s\S]*{[\s\S]*".*"\s*:[\s\S]*}[\s\S]*\]$/] },
  { language: 'xml', patterns: [/<\?xml/, /<\w+>.*<\/\w+>/, /<\w+\s+.*?\/>/] },
  { language: 'yaml', patterns: [/^\w+:\s*$/, /^\s*-\s+\w+:/, /^\s*\w+:\s+.*$/] },
  { language: 'markdown', patterns: [/^#\s+.*$/, /^#+\s+.*$/, /\[.*\]\(.*\)/, /\*\*.*\*\*/, /`{3}[\s\S]*`{3}/] },
  { language: 'bash', patterns: [/^#!/, /if\s+\[\s+.*\s+\]/, /for\s+\w+\s+in/, /while\s+\[\s+.*\s+\]/, /function\s+\w+\s*\(/, /echo\s+"/] },
  { language: 'powershell', patterns: [/\$\w+\s*=/, /Get-\w+/, /Set-\w+/, /Write-\w+/, /\[.*\]::/] }
];

/**
 * Gets text nodes from current selection
 */
function getSelectedTextNodes(): TextNode[] {
  const selection = figma.currentPage.selection;
  return selection.filter(node => node.type === 'TEXT') as TextNode[];
}

/**
 * Extracts language from text content if it has a language declaration
 */
function detectLanguage(text: string, defaultLanguage: string | null): string {
  // First check for explicit language declaration
  const declaredLanguage = text.match(LANGUAGE_DECLARATION_REGEX)?.[1]?.toLowerCase();
  if (declaredLanguage) return declaredLanguage;
  
  // If no explicit declaration, try to auto-detect
  const detectedLanguage = autoDetectLanguage(text);
  if (detectedLanguage) return detectedLanguage;
  
  // Fall back to provided default or global default
  return defaultLanguage || DEFAULT_SETTINGS.language;
}

/**
 * Automatically detects the programming language based on code content
 */
function autoDetectLanguage(code: string): string | null {
  if (!code || code.trim().length < 10) {
    return null; // Too short to reliably detect
  }
  
  // Remove leading/trailing whitespace
  const normalizedCode = code.trim();
  
  // Check against known patterns for each language
  const scores: Record<string, number> = {};
  
  for (const { language, patterns } of LANGUAGE_PATTERNS) {
    let matchCount = 0;
    
    for (const pattern of patterns) {
      if (pattern.test(normalizedCode)) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      // Calculate a score based on number of matches and pattern specificity
      scores[language] = matchCount * (1 + patterns.length * 0.1);
    }
  }
  
  // Find language with highest score
  let bestMatch = null;
  let highestScore = 0;
  
  for (const [language, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = language;
    }
  }
  
  // Only return if we have a reasonable confidence
  return highestScore >= 1 ? bestMatch : null;
}

/**
 * Loads plugin settings from client storage
 */
async function getPluginSettings(): Promise<SyntaxerSettings> {
  const settings = await figma.clientStorage.getAsync('pluginSettings') as SyntaxerSettings | undefined;
  return {
    theme: settings?.theme || DEFAULT_SETTINGS.theme,
    language: settings?.language || DEFAULT_SETTINGS.language,
    includeBg: settings?.includeBg || DEFAULT_SETTINGS.includeBg
  };
}

/**
 * Checks current selection and sends data to UI
 */
function checkSelection() {
  const textNodes = getSelectedTextNodes();

  if (textNodes.length > 0) {
    const firstTextNode = textNodes[0];
    const code = firstTextNode.characters;
    const language = detectLanguage(code, null);

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

/**
 * Applies colors to a text node and optionally creates a frame with background
 */
async function applyColorsToNode(
  textNode: TextNode,
  colorData: ColorData[],
  hasLanguageDeclaration: boolean,
  includeBg: boolean,
  backgroundColor?: string
) {
  // Handle background frame if needed
  let frame: FrameNode | null = null;
  if (includeBg) {
    frame = handleNodeBackground(textNode, backgroundColor);
  } else if (textNode.parent && textNode.parent.type === 'FRAME') {
    frame = textNode.parent as FrameNode;
  }

  // Apply syntax highlighting colors to text
  applyTextColors(textNode, colorData, hasLanguageDeclaration);
}

/**
 * Creates or updates background frame for a text node
 */
function handleNodeBackground(textNode: TextNode, backgroundColor?: string): FrameNode {
  let frame: FrameNode;
  
  // Check if the text node is already in a frame
  if (textNode.parent && textNode.parent.type === 'FRAME') {
    frame = textNode.parent as FrameNode;
  } else {
    // Create a new frame with auto layout
    frame = figma.createFrame();
    frame.resize(textNode.width, textNode.height);
    frame.x = textNode.x;
    frame.y = textNode.y;
    
    // Configure frame with auto layout
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO';
    frame.itemSpacing = 0;
    
    // Add padding
    frame.paddingLeft = 20;
    frame.paddingRight = 20;
    frame.paddingTop = 20;
    frame.paddingBottom = 20;
    
    // Add to document hierarchy
    if (textNode.parent) {
      textNode.parent.appendChild(frame);
    }
    frame.appendChild(textNode);
  }

  // Apply background color to the frame if provided
  if (backgroundColor) {
    const bgColor = figma.util.rgb(backgroundColor);
    frame.fills = [{ type: 'SOLID', color: bgColor }];
  }
  
  return frame;
}

/**
 * Applies colors to different parts of text node
 */
function applyTextColors(
  textNode: TextNode, 
  colorData: ColorData[], 
  hasLanguageDeclaration: boolean
) {
  let currentIndex = 0;
  
  // Handle language declaration line separately
  if (hasLanguageDeclaration) {
    currentIndex = textNode.characters.indexOf('\n') + 1;
    textNode.setRangeFills(0, currentIndex, [{ 
      type: 'SOLID', 
      color: {r: 0, g: 0, b: 0} 
    }]);
  }
  
  // Apply colors to each text segment
  colorData.forEach(({ text, color }) => {
    const endIndex = currentIndex + text.length;
    const textColor = figma.util.rgb(color);
    
    textNode.setRangeFills(
      currentIndex, 
      endIndex, 
      [{ type: 'SOLID', color: textColor }]
    );
    
    currentIndex = endIndex;
  });
}

/**
 * Processes auto syntax highlighting command
 */
async function handleAutoSyntaxCommand() {
  const textNodes = getSelectedTextNodes();

  if (textNodes.length > 0) {
    const settings = await getPluginSettings();
    
    // Show UI temporarily to process the syntax highlighting
    figma.showUI(__html__, { visible: false });

    // Send all nodes to be processed
    figma.ui.postMessage({
      type: 'process-nodes',
      nodes: textNodes.map(node => ({
        content: node.characters,
        language: detectLanguage(node.characters, settings.language)
      })),
      settings
    });
  } else {
    figma.notify('Please select at least one text layer');
    figma.closePlugin();
  }
}

/**
 * Handles all messages from UI
 */
async function handleUIMessages(msg: UIMessage) {
  switch (msg.type) {
    case 'init':
      if (figma.command !== 'auto-syntax') {
        checkSelection();
      }
      break;
      
    case 'applyDetailedColors':
      await handleApplyColors();
      break;
      
    case 'processedNodes':
      if (msg.processedNodes) {
        await handleProcessedNodes(msg);
      }
      break;
      
    case 'themeChanged':
      if (msg.theme) {
        console.log('Theme changed to:', msg.theme);
      }
      break;
      
    case 'saveSettings':
      if (msg.settings) {
        await figma.clientStorage.setAsync('pluginSettings', msg.settings);
      }
      break;
  }
}

/**
 * Handles applying colors to selected nodes
 */
async function handleApplyColors() {
  const textNodes = getSelectedTextNodes();

  if (textNodes.length > 0) {
    const settings = await getPluginSettings();

    // Process all nodes at once
    figma.ui.postMessage({
      type: 'process-nodes',
      nodes: textNodes.map(node => ({
        content: node.characters,
        language: detectLanguage(node.characters, settings.language)
      })),
      settings
    });
  } else {
    figma.notify('Please select at least one text layer');
  }
}

/**
 * Processes nodes with syntax highlighting
 */
async function handleProcessedNodes(msg: UIMessage) {
  const textNodes = getSelectedTextNodes();
  
  // Apply colors to each node
  if (msg.processedNodes && msg.processedNodes.length > 0) {
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
  }

  // Notify user and close plugin if in auto mode
  figma.notify(`Updated ${textNodes.length} text ${textNodes.length === 1 ? 'layer' : 'layers'}`);
  if (figma.command === 'auto-syntax') {
    figma.closePlugin();
  }
}

// Main plugin logic
async function main() {
  // Handle different plugin commands
  if (figma.command === 'auto-syntax') {
    await handleAutoSyntaxCommand();
  } else {
    figma.showUI(__html__, { width: 600, height: 500 });
    checkSelection();
  }

  // Set up event listeners
  figma.on('selectionchange', () => {
    if (figma.command !== 'auto-syntax') {
      checkSelection();
    }
  });

  // Set up message handler
  figma.ui.onmessage = handleUIMessages;

  // Load and send settings to UI
  const settings = await figma.clientStorage.getAsync('pluginSettings');
  if (settings) {
    figma.ui.postMessage({
      type: 'loadSettings',
      settings
    });
  }
}

// Initialize the plugin
main();
