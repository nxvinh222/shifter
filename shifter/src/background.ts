import storageManager from './storage';
import contextMenuManager from './contextMenu';

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Shifter extension installed');
  
  // Initialize settings
  await storageManager.initSettings();
  
  // Initialize context menu
  await contextMenuManager.initialize();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info) => {
  contextMenuManager.handleMenuClick(info);
});

// Listen for language updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'languageDetected' && message.language) {
    storageManager.addLanguageToHistory(message.language)
      .then(() => storageManager.getSettings())
      .then((settings) => contextMenuManager.updateLanguageOptions(settings))
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Error handling language detection:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
}); 