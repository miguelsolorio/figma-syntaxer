export function detectLanguage(code: string): string {
  // Simple heuristics for language detection
  if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
    return 'python';
  } else if (code.includes('function ') || code.includes('var ') || code.includes('const ')) {
    return 'javascript';
  } else if (code.includes('interface ') || code.includes('class ') || code.includes(':')) {
    return 'typescript';
  } else if (code.includes('<html') || code.includes('<!DOCTYPE html')) {
    return 'html';
  } else if (code.includes('{') && code.includes('}') && code.includes(':')) {
    return 'css';
  } else if (code.startsWith('{') && code.endsWith('}')) {
    return 'json';
  } else if (code.includes('#') && code.includes('##')) {
    return 'markdown';
  }
  // Add more language detection rules as needed
  
  return 'python'; // Default to Python if no match is found
}