import { ShifterSettings, LangKeyConfig } from './types';
import languageKeys from './languageKeys.json';

// Default settings
const DEFAULT_SETTINGS: ShifterSettings = {
  enabled: true,
  languageHistory: []
};

export class StorageManager {
  private static instance: StorageManager;
  private config: LangKeyConfig = languageKeys;
  
  private constructor() {}
  
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }
  
  // Initialize settings if they don't exist
  public async initSettings(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings) {
      await this.saveSettings(DEFAULT_SETTINGS);
    }
  }
  
  // Get current settings
  public async getSettings(): Promise<ShifterSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('shifterSettings', (result) => {
        resolve(result.shifterSettings || DEFAULT_SETTINGS);
      });
    });
  }
  
  // Save settings
  public async saveSettings(settings: ShifterSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ shifterSettings: settings }, () => {
        resolve();
      });
    });
  }
  
  // Add a language to history without duplicates
  public async addLanguageToHistory(language: string): Promise<void> {
    const settings = await this.getSettings();
    
    if (!settings.languageHistory.includes(language)) {
      settings.languageHistory.push(language);
      await this.saveSettings(settings);
    }
  }
  
  // Update website's localStorage with new language
  public async updateWebsiteLanguage(language: string): Promise<void> {
    await this.addLanguageToHistory(language);
    
    // Message the content script to update website's localStorage
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateLanguage', 
          language,
          keys: this.config.keys
        });
      }
    });
  }
  
  // Toggle enabled state
  public async toggleEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    settings.enabled = !settings.enabled;
    await this.saveSettings(settings);
    return settings.enabled;
  }
}

export default StorageManager.getInstance(); 