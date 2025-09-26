import * as SecureStore from 'expo-secure-store';
const STORAGE_KEYS = {
  API_KEY: 'ai_nodes_api_key',
  SETTINGS: 'ai_nodes_settings',
  USER_PREFERENCES: 'ai_nodes_user_preferences',
};
export class SecureStorage {
  static async setApiKey(apiKey) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.API_KEY, apiKey);
    } catch (error) {
      console.error('Failed to store API key:', error);
      throw new Error('Failed to store API key securely');
    }
  }
  static async getApiKey() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }
  static async removeApiKey() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY);
    } catch (error) {
      console.error('Failed to remove API key:', error);
    }
  }
  static async setSettings(settings) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to store settings:', error);
      throw new Error('Failed to store settings');
    }
  }
  static async getSettings() {
    try {
      const settings = await SecureStore.getItemAsync(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Failed to retrieve settings:', error);
      return null;
    }
  }
  static async setUserPreferences(preferences) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to store user preferences:', error);
      throw new Error('Failed to store user preferences');
    }
  }
  static async getUserPreferences() {
    try {
      const preferences = await SecureStore.getItemAsync(STORAGE_KEYS.USER_PREFERENCES);
      return preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return null;
    }
  }
  static async clearAll() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY),
        SecureStore.deleteItemAsync(STORAGE_KEYS.SETTINGS),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_PREFERENCES),
      ]);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}
