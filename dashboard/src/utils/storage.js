import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'appSettings';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

// Settings management
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
};

export const getSettings = async () => {
  try {
    const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    // If no settings exist, load from config file
    const defaultSettings = require('../../assets/config/settings.json');
    await saveSettings(defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
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
