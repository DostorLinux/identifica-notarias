import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'appSettings';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

// Default settings - fallback if file loading fails
const DEFAULT_SETTINGS = {
  "subdomain": "access-control-test",
  "username": "admin",
  "password": "gate.2020",
  "apiKey": "pla2020pli",
  "deviceId": "device-001",
  "environment": "production",
  "version": "2.0.0"
};

// Settings management
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('✅ Settings saved successfully:', settings.subdomain);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    return { success: false, error: error.message };
  }
};

export const getSettings = async () => {
  try {
    console.log('🔍 Loading settings...');
    
    // DOCKER: First try to load from external config endpoint
    let runtimeSettings = null;
    try {
      console.log('🐳 Checking for runtime config...');
      const configUrl = `${window.location.origin}/config/settings.json`;
      const response = await fetch(configUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        runtimeSettings = await response.json();
        console.log('✅ Runtime settings loaded from external config:', runtimeSettings.subdomain);
        // Save to AsyncStorage and return immediately
        await saveSettings(runtimeSettings);
        return runtimeSettings;
      }
    } catch (runtimeError) {
      console.log('⚠️ No external runtime config found, continuing with fallback...');
    }
    
    // Fallback: Try to get from AsyncStorage
    const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      console.log('✅ Settings loaded from AsyncStorage:', parsed.subdomain);
      return parsed;
    }
    
    // If no settings in AsyncStorage, try to load from bundled file
    console.log('📁 No settings in AsyncStorage, loading from bundled file...');
    
    let fileSettings = null;
    try {
      // Try to load from the bundled config file
      fileSettings = require('../../assets/config/settings.json');
      console.log('✅ Settings loaded from bundled file:', fileSettings.subdomain);
    } catch (fileError) {
      console.log('⚠️ Could not load from bundled file, using default settings:', fileError.message);
      fileSettings = DEFAULT_SETTINGS;
    }
    
    // Save to AsyncStorage for future use
    await saveSettings(fileSettings);
    console.log('✅ Settings initialized and saved');
    return fileSettings;
    
  } catch (error) {
    console.error('❌ Error getting settings, using defaults:', error);
    // Return default settings as last resort
    return DEFAULT_SETTINGS;
  }
};

// Force load settings directly from file (ignore AsyncStorage)
export const forceLoadFromFile = async () => {
  try {
    console.log('🔥 FORCE: Loading settings directly from file...');
    
    let fileSettings = null;
    try {
      // Direct require from file
      fileSettings = require('../../assets/config/settings.json');
      console.log('✅ FORCE: Settings loaded from file:', fileSettings);
    } catch (fileError) {
      console.log('❌ FORCE: Could not load from file:', fileError.message);
      fileSettings = DEFAULT_SETTINGS;
      console.log('✅ FORCE: Using hardcoded defaults:', fileSettings);
    }
    
    return fileSettings;
    
  } catch (error) {
    console.error('❌ FORCE: Error loading from file:', error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = async (updates) => {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...updates };
    await saveSettings(newSettings);
    return { success: true, settings: newSettings };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }
};

// Force reload settings from file (for debug purposes)
export const reloadSettingsFromFile = async () => {
  try {
    console.log('🔄 Force reloading settings from file...');
    
    // Clear AsyncStorage settings first
    await AsyncStorage.removeItem(SETTINGS_KEY);
    console.log('🧹 AsyncStorage cleared');
    
    // Force load from file
    const fileSettings = await forceLoadFromFile();
    
    // Save the file settings to AsyncStorage
    await saveSettings(fileSettings);
    console.log('✅ Settings reloaded and saved:', fileSettings.subdomain);
    
    return fileSettings;
  } catch (error) {
    console.error('❌ Error reloading settings:', error);
    return null;
  }
};

// Completely reset settings to file defaults
export const resetToFileDefaults = async () => {
  try {
    console.log('🔥 RESET: Completely resetting to file defaults...');
    
    // Clear everything from AsyncStorage
    await AsyncStorage.multiRemove([SETTINGS_KEY, TOKEN_KEY, USER_KEY]);
    console.log('🧹 All AsyncStorage cleared');
    
    // Force load from file
    const fileSettings = await forceLoadFromFile();
    
    // Save fresh settings
    await saveSettings(fileSettings);
    console.log('✅ RESET COMPLETE: Fresh settings saved:', fileSettings);
    
    return fileSettings;
    
  } catch (error) {
    console.error('❌ RESET ERROR:', error);
    return DEFAULT_SETTINGS;
  }
};

// Token management
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return { success: true };
  } catch (error) {
    console.error('Error saving token:', error);
    return { success: false, error: error.message };
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error removing token:', error);
    return { success: false, error: error.message };
  }
};

// User data management
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error: error.message };
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing user data:', error);
    return { success: false, error: error.message };
  }
};

// Clear all app data
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([SETTINGS_KEY, TOKEN_KEY, USER_KEY]);
    return { success: true };
  } catch (error) {
    console.error('Error clearing all data:', error);
    return { success: false, error: error.message };
  }
};
