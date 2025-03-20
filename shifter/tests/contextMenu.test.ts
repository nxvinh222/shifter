/// <reference types="jest" />
import { ContextMenuManager } from '../src/contextMenu';
import storageManager from '../src/storage';
import { ShifterSettings } from '../src/types';

// Mock chrome API
const mockContextMenus = {
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn((id, callback) => {
    if (callback) callback();
  }),
  removeAll: jest.fn((callback) => {
    if (callback) callback();
  })
};

const mockChromeTabs = {
  reload: jest.fn()
};

const mockRuntime = {
  lastError: null // Add lastError property for error handling
};

// Assign mocks to global chrome object
(global as any).chrome = {
  contextMenus: mockContextMenus,
  tabs: mockChromeTabs,
  runtime: mockRuntime
};

// Mock storage manager
jest.mock('../src/storage', () => ({
  __esModule: true,
  default: {
    getSettings: jest.fn(),
    updateWebsiteLanguage: jest.fn(),
    toggleEnabled: jest.fn()
  }
}));

describe('ContextMenuManager', () => {
  let contextMenuManager: ContextMenuManager;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.useFakeTimers(); // Use fake timers to handle setTimeout
    
    // Create a new instance for each test
    (ContextMenuManager as any)['instance'] = undefined;
    contextMenuManager = ContextMenuManager.getInstance();
  });
  
  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
  });
  
  describe('initialize', () => {
    it('should create context menu items', async () => {
      // Mock getSettings to return settings
      const mockSettings: ShifterSettings = {
        enabled: true,
        languageHistory: ['en', 'fr', 'de']
      };
      (storageManager.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      
      await contextMenuManager.initialize();
      
      // Should clear existing menus first
      expect(mockContextMenus.removeAll).toHaveBeenCalled();
      
      // Should create parent menu
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-menu',
        title: 'Shifter Language',
        contexts: ['all']
      });
      
      // Should create toggle option
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-toggle',
        parentId: 'shifter-menu',
        title: 'Disable Shifter',
        contexts: ['all']
      });
      
      // Should create separator
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-separator',
        parentId: 'shifter-menu',
        type: 'separator',
        contexts: ['all']
      });
      
      // Should create language options
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-lang-0',
        parentId: 'shifter-menu',
        title: 'en',
        contexts: ['all']
      });
      
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-lang-1',
        parentId: 'shifter-menu',
        title: 'fr',
        contexts: ['all']
      });
      
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-lang-2',
        parentId: 'shifter-menu',
        title: 'de',
        contexts: ['all']
      });
    });
    
    it('should show message if no languages are found', async () => {
      // Mock getSettings to return settings with no languages
      const mockSettings: ShifterSettings = {
        enabled: true,
        languageHistory: []
      };
      (storageManager.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      
      await contextMenuManager.initialize();
      
      // Should create "no languages" menu item
      expect(mockContextMenus.create).toHaveBeenCalledWith({
        id: 'shifter-no-languages',
        parentId: 'shifter-menu',
        title: 'No languages found yet',
        enabled: false,
        contexts: ['all']
      });
    });
  });
  
  describe('handleMenuClick', () => {
    it('should handle toggle click', async () => {
      // Mock toggleEnabled to return true
      (storageManager.toggleEnabled as jest.Mock).mockResolvedValue(true);
      
      // Call handleMenuClick with toggle menu item
      await contextMenuManager.handleMenuClick({ menuItemId: 'shifter-toggle' } as chrome.contextMenus.OnClickData);
      
      // Resolve all promises
      await Promise.resolve();
      
      // Should call toggleEnabled
      expect(storageManager.toggleEnabled).toHaveBeenCalled();
      
      // Should update menu item
      expect(mockContextMenus.update).toHaveBeenCalledWith('shifter-toggle', {
        title: 'Disable Shifter'
      });
    });
    
    it('should handle language change click', async () => {
      // Mock getSettings to return settings
      const mockSettings: ShifterSettings = {
        enabled: true,
        languageHistory: ['en', 'fr', 'de']
      };
      (storageManager.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      
      // Call handleMenuClick with language menu item
      await contextMenuManager.handleMenuClick({ menuItemId: 'shifter-lang-1' } as chrome.contextMenus.OnClickData);
      
      // Resolve all promises
      await Promise.resolve();
      
      // Should call updateWebsiteLanguage with the language
      expect(storageManager.updateWebsiteLanguage).toHaveBeenCalledWith('fr');
      
      // Page reload is now handled by the content script
      expect(mockChromeTabs.reload).not.toHaveBeenCalled();
    });
    
    it('should not update language if extension is disabled', async () => {
      // Mock getSettings to return settings with disabled
      const mockSettings: ShifterSettings = {
        enabled: false,
        languageHistory: ['en', 'fr', 'de']
      };
      (storageManager.getSettings as jest.Mock).mockResolvedValue(mockSettings);
      
      // Call handleMenuClick with language menu item
      await contextMenuManager.handleMenuClick({ menuItemId: 'shifter-lang-1' } as chrome.contextMenus.OnClickData);
      
      // Resolve all promises
      await Promise.resolve();
      
      // Should not call updateWebsiteLanguage or reload
      expect(storageManager.updateWebsiteLanguage).not.toHaveBeenCalled();
      expect(mockChromeTabs.reload).not.toHaveBeenCalled();
    });
  });
}); 