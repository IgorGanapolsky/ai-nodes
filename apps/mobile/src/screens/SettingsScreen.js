import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/formatters';
const SettingsScreen = () => {
  const { settings, loading, updateSettings, resetSettings, validateApiKey } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isValidating, setIsValidating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  const handleUpdateSetting = (key, value) => {
    setLocalSettings((prev) => {
      const updated = { ...prev };
      if (key.includes('.')) {
        const keys = key.split('.');
        let obj = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      } else {
        updated[key] = value;
      }
      return updated;
    });
    setHasChanges(true);
  };
  const handleSaveSettings = async () => {
    const result = await updateSettings(localSettings);
    if (result.success) {
      setHasChanges(false);
      Alert.alert('Success', 'Settings saved successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to save settings');
    }
  };
  const handleValidateApiKey = async () => {
    if (!localSettings.apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }
    setIsValidating(true);
    try {
      const result = await validateApiKey(localSettings.apiKey);
      if (result.valid) {
        Alert.alert('Success', 'API key is valid');
      } else {
        Alert.alert('Invalid API Key', result.error || 'The provided API key is not valid');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };
  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default? This will also clear your API key.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const result = await resetSettings();
            if (result.success) {
              setHasChanges(false);
              Alert.alert('Success', 'Settings have been reset');
            } else {
              Alert.alert('Error', result.error || 'Failed to reset settings');
            }
          },
        },
      ],
    );
  };
  if (loading.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      {/* API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>API Key</Text>
            <TextInput
              style={styles.textInput}
              value={localSettings.apiKey}
              onChangeText={(value) => handleUpdateSetting('apiKey', value)}
              placeholder="Enter your API key"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.validateButton, isValidating && styles.validateButtonDisabled]}
              onPress={handleValidateApiKey}
              disabled={isValidating}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.validateButtonText}>Validate</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            Your API key is used to connect to the AI Nodes service. Keep it secure and don't share
            it.
          </Text>
        </View>
      </View>

      {/* Auto-Reinvest Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Reinvest</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Auto-Reinvest</Text>
              <Text style={styles.settingDescription}>
                Automatically reinvest earnings when threshold is reached
              </Text>
            </View>
            <Switch
              value={localSettings.autoReinvest}
              onValueChange={(value) => handleUpdateSetting('autoReinvest', value)}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={localSettings.autoReinvest ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Reinvest Threshold</Text>
            <TextInput
              style={styles.textInput}
              value={localSettings.reinvestThreshold.toString()}
              onChangeText={(value) => {
                const numValue = parseFloat(value) || 0;
                handleUpdateSetting('reinvestThreshold', numValue);
              }}
              placeholder="100"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Current threshold: {formatCurrency(localSettings.reinvestThreshold)}
            </Text>
          </View>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications for important events
              </Text>
            </View>
            <Switch
              value={localSettings.notifications.enabled}
              onValueChange={(value) => handleUpdateSetting('notifications.enabled', value)}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={localSettings.notifications.enabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          {localSettings.notifications.enabled && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Node Offline Alerts</Text>
                  <Text style={styles.settingDescription}>Get notified when nodes go offline</Text>
                </View>
                <Switch
                  value={localSettings.notifications.nodeOffline}
                  onValueChange={(value) => handleUpdateSetting('notifications.nodeOffline', value)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={localSettings.notifications.nodeOffline ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Earnings Target</Text>
                  <Text style={styles.settingDescription}>
                    Get notified when earnings reach targets
                  </Text>
                </View>
                <Switch
                  value={localSettings.notifications.earningsTarget}
                  onValueChange={(value) =>
                    handleUpdateSetting('notifications.earningsTarget', value)
                  }
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={localSettings.notifications.earningsTarget ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Low Performance Alerts</Text>
                  <Text style={styles.settingDescription}>
                    Get notified when node performance drops
                  </Text>
                </View>
                <Switch
                  value={localSettings.notifications.lowPerformance}
                  onValueChange={(value) =>
                    handleUpdateSetting('notifications.lowPerformance', value)
                  }
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={localSettings.notifications.lowPerformance ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Refresh Interval (seconds)</Text>
            <TextInput
              style={styles.textInput}
              value={localSettings.refreshInterval.toString()}
              onChangeText={(value) => {
                const numValue = parseInt(value) || 30;
                handleUpdateSetting('refreshInterval', Math.max(10, numValue));
              }}
              placeholder="30"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              How often to refresh data automatically (minimum 10 seconds)
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>AI Nodes Dashboard</Text>
        <Text style={styles.infoText}>Version 1.0.0</Text>
        <Text style={styles.infoText}>
          Monitor and manage your AI compute nodes with real-time metrics and automated
          reinvestment.
        </Text>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  validateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  validateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
});
export default SettingsScreen;
