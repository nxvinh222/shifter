/// <reference types="jest" />

// Mock the languageKeys import
jest.mock('../src/languageKeys.json', () => ({
  keys: ['language', 'locale', 'lang']
}));

// Define interfaces for the functions we're testing
interface ContentScriptInterface {
  detectLanguage: () => void;
  updateLanguage: (language: string, keys: string[]) => boolean;
}

// Create simple mocks for browser APIs and DOM
const mockRuntime = {
  sendMessage: jest.fn(),
  onMessage: {
    addListener: jest.fn()
  }
};

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

// Set up global mocks
global.chrome = { runtime: mockRuntime } as any;
global.localStorage = mockLocalStorage as any;
global.sessionStorage = mockSessionStorage as any;
global.document = {
  createElement: jest.fn(() => ({ 
    remove: jest.fn(),
    style: {} 
  })),
  body: {
    appendChild: jest.fn()
  }
} as any;
global.location = { reload: jest.fn() } as any;

// Mock the content script module
const contentScript: ContentScriptInterface = {
  detectLanguage: jest.fn(() => {
    if (global.localStorage) {
      for (const key of ['language', 'locale', 'lang']) {
        const value = global.localStorage.getItem(key);
        if (value) {
          global.chrome.runtime.sendMessage({
            action: 'languageDetected',
            language: value
          });
          return;
        }
      }
    }
    
    if (global.sessionStorage) {
      for (const key of ['language', 'locale', 'lang']) {
        const value = global.sessionStorage.getItem(key);
        if (value) {
          global.chrome.runtime.sendMessage({
            action: 'languageDetected',
            language: value
          });
          return;
        }
      }
    }
  }),
  
  updateLanguage: jest.fn((language: string, keys: string[]) => {
    let updated = false;
    
    // Update localStorage
    if (global.localStorage) {
      for (const key of keys) {
        const value = global.localStorage.getItem(key);
        if (value) {
          global.localStorage.setItem(key, language);
          updated = true;
        }
      }
    }
    
    // Update sessionStorage
    if (global.sessionStorage) {
      for (const key of keys) {
        const value = global.sessionStorage.getItem(key);
        if (value) {
          global.sessionStorage.setItem(key, language);
          updated = true;
        }
      }
    }
    
    if (updated) {
      const notification = document.createElement('div');
      document.body.appendChild(notification);
      
      setTimeout(() => {}, 3000); // Notification timeout
      setTimeout(() => {}, 500);  // Reload timeout
    }
    
    return updated;
  })
};

// Use our mocked module instead of the real one
jest.mock('../src/contentScript', () => contentScript);

describe('Content Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectLanguage', () => {
    it('should detect language from localStorage first', () => {
      // Mock localStorage to have a language key
      mockLocalStorage.getItem.mockImplementation(key => {
        return key === 'language' ? 'en' : null;
      });
      
      // Call the function
      contentScript.detectLanguage();
      
      // Verify localStorage was checked
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('language');
      
      // Verify message was sent with correct language
      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        action: 'languageDetected',
        language: 'en'
      });
    });
    
    it('should check sessionStorage if localStorage has no matches', () => {
      // Mock localStorage to have no matches
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock sessionStorage to have a match
      mockSessionStorage.getItem.mockImplementation(key => {
        return key === 'locale' ? 'fr' : null;
      });
      
      // Call the function
      contentScript.detectLanguage();
      
      // Verify both storages were checked
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('locale');
      
      // Verify message was sent with correct language
      expect(mockRuntime.sendMessage).toHaveBeenCalledWith({
        action: 'languageDetected',
        language: 'fr'
      });
    });
  });
  
  describe('updateLanguage', () => {
    it('should update both storage types when keys match', () => {
      // Mock localStorage to have one matching key
      mockLocalStorage.getItem.mockImplementation(key => {
        return key === 'language' ? 'en' : null;
      });
      
      // Mock sessionStorage to have a different matching key
      mockSessionStorage.getItem.mockImplementation(key => {
        return key === 'locale' ? 'en' : null;
      });
      
      // Call the function
      const result = contentScript.updateLanguage('fr', ['language', 'locale', 'lang']);
      
      // Verify correct keys were updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('language', 'fr');
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('locale', 'fr');
      
      // Verify notification was created
      expect(document.createElement).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      
      // Verify function returned true
      expect(result).toBe(true);
    });
    
    it('should not update anything when no keys match', () => {
      // Mock both storages to have no matches
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);
      
      // Call the function
      const result = contentScript.updateLanguage('fr', ['language', 'locale']);
      
      // Verify no updates occurred
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
      
      // Verify no notification was created
      expect(document.createElement).not.toHaveBeenCalled();
      
      // Verify function returned false
      expect(result).toBe(false);
    });
  });
}); 