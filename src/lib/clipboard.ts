import { ClipboardItem } from '@/types';

// Store active clipboard timeouts
const activeClipboards = new Map<string, NodeJS.Timeout>();

/**
 * Copy text to clipboard with auto-clear after specified timeout
 * @param text - Text to copy
 * @param clearAfterMs - Time in milliseconds before clearing (default: 15000ms = 15s)
 * @returns Promise that resolves to boolean indicating success
 */
export async function copyToClipboardWithAutoClear(
  text: string, 
  clearAfterMs: number = 15000
): Promise<boolean> {
  try {
    // Copy to clipboard
    await navigator.clipboard.writeText(text);
    
    // Clear any existing timeout for this text
    const existingTimeout = activeClipboards.get(text);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set up auto-clear
    const timeoutId = setTimeout(async () => {
      try {
        // Check if the clipboard still contains our text before clearing
        const clipboardContent = await navigator.clipboard.readText();
        if (clipboardContent === text) {
          await navigator.clipboard.writeText(''); // Clear clipboard
        }
        activeClipboards.delete(text);
      } catch (error) {
        // Ignore errors when clearing clipboard
        // Some browsers don't allow reading clipboard in all contexts
        activeClipboards.delete(text);
      }
    }, clearAfterMs);
    
    // Store the timeout
    activeClipboards.set(text, timeoutId);
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Copy text to clipboard (fallback method for older browsers)
 * @param text - Text to copy
 * @returns boolean indicating success
 */
export function fallbackCopyToClipboard(text: string): boolean {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    textArea.style.left = '-1000px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Try to copy
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback clipboard copy failed:', error);
    return false;
  }
}

/**
 * Copy text with auto-clear, includes fallback for older browsers
 * @param text - Text to copy
 * @param clearAfterMs - Time in milliseconds before clearing (default: 15000ms = 15s)
 * @returns Promise that resolves to boolean indicating success
 */
export async function copyWithAutoClear(
  text: string, 
  clearAfterMs: number = 15000
): Promise<boolean> {
  // Check if modern clipboard API is available
  if (navigator.clipboard && window.isSecureContext) {
    return copyToClipboardWithAutoClear(text, clearAfterMs);
  } else {
    // Fallback to older method (no auto-clear for fallback)
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Cancel auto-clear for specific text
 * @param text - The text to cancel auto-clear for
 */
export function cancelAutoClear(text: string): void {
  const timeoutId = activeClipboards.get(text);
  if (timeoutId) {
    clearTimeout(timeoutId);
    activeClipboards.delete(text);
  }
}

/**
 * Clear all active clipboard timeouts
 */
export function clearAllAutoClears(): void {
  activeClipboards.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  activeClipboards.clear();
}