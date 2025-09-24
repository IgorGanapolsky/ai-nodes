import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';
import { SecureStorage } from '../utils/storage';
const defaultSettings = {
    apiKey: '',
    autoReinvest: false,
    reinvestThreshold: 100,
    notifications: {
        enabled: true,
        nodeOffline: true,
        earningsTarget: true,
        lowPerformance: true,
    },
    refreshInterval: 30,
};
export const useSettings = () => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState({ isLoading: true, error: null });
    const loadSettings = useCallback(async () => {
        setLoading({ isLoading: true, error: null });
        try {
            // Load from secure storage first
            const storedSettings = await SecureStorage.getSettings();
            const apiKey = await SecureStorage.getApiKey();
            if (storedSettings || apiKey) {
                const combinedSettings = {
                    ...defaultSettings,
                    ...storedSettings,
                    apiKey: apiKey || storedSettings?.apiKey || '',
                };
                setSettings(combinedSettings);
                // Set API key in client
                if (combinedSettings.apiKey) {
                    apiClient.setApiKey(combinedSettings.apiKey);
                }
            }
            // Try to sync with server if API key exists
            if (apiKey) {
                const response = await apiClient.getSettings();
                if (response.success && response.data) {
                    const serverSettings = { ...response.data, apiKey };
                    setSettings(serverSettings);
                    await SecureStorage.setSettings(serverSettings);
                }
            }
        }
        catch (error) {
            setLoading({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to load settings'
            });
        }
        finally {
            setLoading(prev => ({ ...prev, isLoading: false }));
        }
    }, []);
    const updateSettings = useCallback(async (newSettings) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);
            // Save to secure storage
            await SecureStorage.setSettings(updatedSettings);
            // Save API key separately if provided
            if (newSettings.apiKey) {
                await SecureStorage.setApiKey(newSettings.apiKey);
                apiClient.setApiKey(newSettings.apiKey);
            }
            // Sync with server if API key exists
            if (updatedSettings.apiKey) {
                const response = await apiClient.updateSettings(updatedSettings);
                if (!response.success) {
                    console.warn('Failed to sync settings with server:', response.error);
                }
            }
            return { success: true };
        }
        catch (error) {
            // Revert settings on error
            setSettings(settings);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update settings'
            };
        }
    }, [settings]);
    const resetSettings = useCallback(async () => {
        try {
            setSettings(defaultSettings);
            await SecureStorage.clearAll();
            apiClient.setApiKey('');
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reset settings'
            };
        }
    }, []);
    const validateApiKey = useCallback(async (apiKey) => {
        try {
            // Create a temporary API client instance for validation
            const tempApiClient = { setApiKey: apiClient.setApiKey, getNodes: apiClient.getNodes };
            tempApiClient.setApiKey(apiKey);
            const response = await tempApiClient.getNodes();
            return { valid: response.success, error: response.error };
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Invalid API key'
            };
        }
    }, []);
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);
    return {
        settings,
        loading,
        updateSettings,
        resetSettings,
        validateApiKey,
        reloadSettings: loadSettings,
    };
};
