export interface ShifterSettings {
  enabled: boolean;
  languageHistory: string[];
}

export interface LangKeyConfig {
  keys: string[];
}

export interface StorageChange {
  newValue?: any;
  oldValue?: any;
} 