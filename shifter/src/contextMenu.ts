import storageManager from './storage';
import { ShifterSettings } from './types';

export class ContextMenuManager {
  private static instance: ContextMenuManager;
  private parentId = 'shifter-menu';
  private currentLanguageItems: string[] = []; // Track current language menu items
  private hasNoLanguagesItem = false; // Track if "no languages" item exists
  
  private constructor() {}
  
  public static getInstance(): ContextMenuManager {
    if (!ContextMenuManager.instance) {
      ContextMenuManager.instance = new ContextMenuManager();
    }
    return ContextMenuManager.instance;
  }
  
  // Initialize context menu
  public async initialize(): Promise<void> {
    // Remove existing menu items to avoid duplicates
    await this.clearMenus();
    
    // Create parent menu
    chrome.contextMenus.create({
      id: this.parentId,
      title: 'Shifter Language',
      contexts: ['all']
    });
    
    // Add toggle option
    const settings = await storageManager.getSettings();
    this.addToggleOption(settings.enabled);
    
    // Add language history options
    await this.updateLanguageOptions(settings);
  }
  
  // Add toggle option to menu
  private addToggleOption(enabled: boolean): void {
    chrome.contextMenus.create({
      id: 'shifter-toggle',
      parentId: this.parentId,
      title: `${enabled ? 'Disable' : 'Enable'} Shifter`,
      contexts: ['all']
    });
    
    // Add separator
    chrome.contextMenus.create({
      id: 'shifter-separator',
      parentId: this.parentId,
      type: 'separator',
      contexts: ['all']
    });
  }
  
  // Safely remove a menu item
  private async safeRemoveMenuItem(id: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        chrome.contextMenus.remove(id, () => {
          // Check for error
          const error = chrome.runtime.lastError;
          if (error) {
            console.log(`Safe remove: ${id} - ${error.message}`);
          }
          resolve();
        });
      } catch (e) {
        console.log(`Exception removing menu item ${id}: ${e}`);
        resolve();
      }
    });
  }
  
  // Update language options in menu
  public async updateLanguageOptions(settings: ShifterSettings): Promise<void> {
    try {
      // Keep track of IDs that need to be removed
      const oldLanguageItems = [...this.currentLanguageItems];
      this.currentLanguageItems = [];
      
      // Remove old language items safely
      const removePromises = oldLanguageItems.map(id => this.safeRemoveMenuItem(id));
      
      // Also remove the "no languages" item if it exists
      if (this.hasNoLanguagesItem) {
        removePromises.push(this.safeRemoveMenuItem('shifter-no-languages'));
        this.hasNoLanguagesItem = false;
      }
      
      // Wait for all removals to complete
      await Promise.all(removePromises);
      
      // Add language options from history
      if (settings.languageHistory.length === 0) {
        chrome.contextMenus.create({
          id: 'shifter-no-languages',
          parentId: this.parentId,
          title: 'No languages found yet',
          enabled: false,
          contexts: ['all']
        });
        this.hasNoLanguagesItem = true;
      } else {
        settings.languageHistory.forEach((lang, index) => {
          const menuId = `shifter-lang-${index}`;
          this.currentLanguageItems.push(menuId);
          
          chrome.contextMenus.create({
            id: menuId,
            parentId: this.parentId,
            title: lang,
            contexts: ['all']
          });
        });
      }
    } catch (error) {
      console.error('Error updating language menu options:', error);
    }
  }
  
  // Handle context menu clicks
  public handleMenuClick(info: chrome.contextMenus.OnClickData): void {
    try {
      if (info.menuItemId === 'shifter-toggle') {
        this.handleToggle();
      } else if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('shifter-lang-')) {
        const index = parseInt(info.menuItemId.replace('shifter-lang-', ''));
        this.handleLanguageChange(index);
      }
    } catch (error) {
      console.error('Error handling menu click:', error);
    }
  }
  
  // Handle toggle click
  private async handleToggle(): Promise<void> {
    try {
      const enabled = await storageManager.toggleEnabled();
      
      // Update toggle menu item
      chrome.contextMenus.update('shifter-toggle', {
        title: `${enabled ? 'Disable' : 'Enable'} Shifter`
      });
    } catch (error) {
      console.error('Error toggling Shifter:', error);
    }
  }
  
  // Handle language change
  private async handleLanguageChange(index: number): Promise<void> {
    try {
      const settings = await storageManager.getSettings();
      
      if (settings.enabled && settings.languageHistory[index]) {
        const language = settings.languageHistory[index];
        await storageManager.updateWebsiteLanguage(language);
        // Page reload is now handled by the content script
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }
  
  // Clear all context menus
  private async clearMenus(): Promise<void> {
    return new Promise((resolve) => {
      chrome.contextMenus.removeAll(() => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.log(`Error clearing menus: ${error.message}`);
        }
        this.currentLanguageItems = []; // Reset tracked items
        this.hasNoLanguagesItem = false; // Reset no languages tracker
        resolve();
      });
    });
  }
}

export default ContextMenuManager.getInstance(); 