import languageKeys from './languageKeys.json';

// Detect language from localStorage and sessionStorage
const detectLanguage = (): void => {
  try {
    let foundLanguage = false;
    
    // Check localStorage
    if (window.localStorage) {
      foundLanguage = checkStorageForLanguage(window.localStorage);
    } else {
      console.warn('Shifter: localStorage not available on this page');
    }
    
    // If not found in localStorage, check sessionStorage
    if (!foundLanguage && window.sessionStorage) {
      checkStorageForLanguage(window.sessionStorage);
    } else if (!window.sessionStorage) {
      console.warn('Shifter: sessionStorage not available on this page');
    }
  } catch (error) {
    console.error('Shifter: Error detecting language:', error);
  }
};

// Check storage (local or session) for language keys
const checkStorageForLanguage = (storage: Storage): boolean => {
  for (const key of languageKeys.keys) {
    const value = storage.getItem(key);
    if (value) {
      console.log(`Shifter: Detected language key "${key}" with value "${value}" in ${storage === window.localStorage ? 'localStorage' : 'sessionStorage'}`);
      
      // Send the detected language to background script
      chrome.runtime.sendMessage({
        action: 'languageDetected',
        language: value
      });
      
      // Found a match
      return true;
    }
  }
  
  // No match found
  return false;
};

// Update localStorage and sessionStorage with new language
const updateLanguage = (language: string, keys: string[]): void => {
  try {
    // Track if any keys were updated
    let updated = false;
    
    // Update localStorage if available
    if (window.localStorage) {
      updated = updateStorageWithLanguage(window.localStorage, language, keys) || updated;
    } else {
      console.warn('Shifter: localStorage not available on this page');
    }
    
    // Update sessionStorage if available
    if (window.sessionStorage) {
      updated = updateStorageWithLanguage(window.sessionStorage, language, keys) || updated;
    } else {
      console.warn('Shifter: sessionStorage not available on this page');
    }
    
    if (updated) {
      // Notify user
      const notification = document.createElement('div');
      notification.textContent = `Language changed to: ${language}`;
      notification.style.position = 'fixed';
      notification.style.top = '10px';
      notification.style.right = '10px';
      notification.style.padding = '10px';
      notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      notification.style.color = 'white';
      notification.style.borderRadius = '4px';
      notification.style.zIndex = '9999';
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      // Reload the page if any keys were updated
      console.log('Shifter: Reloading page to apply language changes');
      // Small delay to ensure storage changes are committed
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (error) {
    console.error('Shifter: Error updating language:', error);
  }
};

// Update specified storage with language
const updateStorageWithLanguage = (storage: Storage, language: string, keys: string[]): boolean => {
  let updated = false;
  
  // Update all matching keys
  for (const key of keys) {
    const value = storage.getItem(key);
    if (value) {
      storage.setItem(key, language);
      console.log(`Shifter: Updated language key "${key}" with value "${language}" in ${storage === window.localStorage ? 'localStorage' : 'sessionStorage'}`);
      updated = true;
    }
  }
  
  return updated;
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateLanguage' && message.language && message.keys) {
    updateLanguage(message.language, message.keys);
    sendResponse({ success: true });
    return true;
  }
});

// Run detection when page is loaded
window.addEventListener('load', () => {
  // Wait a bit to allow websites to initialize storage
  setTimeout(detectLanguage, 1500);
}); 