import { StorageManager } from '../src/storage';
import { ShifterSettings } from '../src/types';

// Mock chrome API
const mockChromeStorage = {
  sync: {
    get: jest.fn(),
    set: jest.fn()
  }
};

const mockChromeTabs = {
  query: jest.fn(),
  sendMessage: jest.fn()
};

// Assign mocks to global chrome object
global.chrome = {
  storage: mockChromeStorage,
  tabs: mockChromeTabs
} as any;

describe('StorageManager', () => {
  let storageManager: StorageManager;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    (StorageManager as any)['instance'] = undefined;
    storageManager = StorageManager.getInstance();
  });
  
  describe('getSettings', () => {
    it('should return default settings if none exist', async () => {
      // Mock chrome.storage.sync.get to return empty result
      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({});
      });
      
      const settings = await storageManager.getSettings();
      
      expect(settings).toEqual({
        enabled: true,
        languageHistory: []
      });
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith('shifterSettings', expect.any(Function));
    });
    
    it('should return stored settings if they exist', async () => {
      const mockSettings: ShifterSettings = {
        enabled: false,
        languageHistory: ['en', 'fr', 'de']
      };
      
      // Mock chrome.storage.sync.get to return stored settings
      mockChromeStorage.sync.get.mockImplementation((key, callback) => {
        callback({ shifterSettings: mockSettings });
      });
      
      const settings = await storageManager.getSettings();
      
      expect(settings).toEqual(mockSettings);
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith('shifterSettings', expect.any(Function));
    });
  });
  
  describe('saveSettings', () => {
    it('should save settings to chrome storage', async () => {
      const settings: ShifterSettings = {
        enabled: true,
        languageHistory: ['en', 'es']
      };
      
      // Mock chrome.storage.sync.set to call callback immediately
      mockChromeStorage.sync.set.mockImplementation((data, callback) => {
        callback();
      });
      
      await storageManager.saveSettings(settings);
      
      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        { shifterSettings: settings },
        expect.any(Function)
      );
    });
  });
  
  describe('addLanguageToHistory', () => {
    it('should add a new language to history', async () => {
      const initialSettings: ShifterSettings = {
        enabled: true,
        languageHistory: ['en', 'fr']
      };
      
      // Mock getSettings to return initial settings
      jest.spyOn(storageManager, 'getSettings').mockResolvedValue(initialSettings);
      
      // Mock saveSettings to do nothing
      jest.spyOn(storageManager, 'saveSettings').mockResolvedValue();
      
      await storageManager.addLanguageToHistory('de');
      
      expect(storageManager.saveSettings).toHaveBeenCalledWith({
        enabled: true,
        languageHistory: ['en', 'fr', 'de']
      });
    });
    
    it('should not add duplicate languages to history', async () => {
      const initialSettings: ShifterSettings = {
        enabled: true,
        languageHistory: ['en', 'fr', 'de']
      };
      
      // Mock getSettings to return initial settings
      jest.spyOn(storageManager, 'getSettings').mockResolvedValue(initialSettings);
      
      // Mock saveSettings to do nothing
      jest.spyOn(storageManager, 'saveSettings').mockResolvedValue();
      
      await storageManager.addLanguageToHistory('fr');
      
      // saveSettings should not be called because 'fr' is already in history
      expect(storageManager.saveSettings).not.toHaveBeenCalled();
    });
  });
  
  describe('toggleEnabled', () => {
    it('should toggle the enabled state from true to false', async () => {
      const initialSettings: ShifterSettings = {
        enabled: true,
        languageHistory: ['en']
      };
      
      // Mock getSettings to return initial settings
      jest.spyOn(storageManager, 'getSettings').mockResolvedValue(initialSettings);
      
      // Mock saveSettings to do nothing
      jest.spyOn(storageManager, 'saveSettings').mockResolvedValue();
      
      const result = await storageManager.toggleEnabled();
      
      expect(result).toBe(false);
      expect(storageManager.saveSettings).toHaveBeenCalledWith({
        enabled: false,
        languageHistory: ['en']
      });
    });
    
    it('should toggle the enabled state from false to true', async () => {
      const initialSettings: ShifterSettings = {
        enabled: false,
        languageHistory: ['en']
      };
      
      // Mock getSettings to return initial settings
      jest.spyOn(storageManager, 'getSettings').mockResolvedValue(initialSettings);
      
      // Mock saveSettings to do nothing
      jest.spyOn(storageManager, 'saveSettings').mockResolvedValue();
      
      const result = await storageManager.toggleEnabled();
      
      expect(result).toBe(true);
      expect(storageManager.saveSettings).toHaveBeenCalledWith({
        enabled: true,
        languageHistory: ['en']
      });
    });
  });
}); 