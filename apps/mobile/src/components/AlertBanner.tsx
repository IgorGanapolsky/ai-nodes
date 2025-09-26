import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Alert } from '../types';
import { formatRelativeTime } from '../utils/formatters';

const { width } = Dimensions.get('window');

interface AlertBannerProps {
  alert: Alert;
  onDismiss: (alertId: string) => void;
  onPress?: (alert: Alert) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert, onDismiss, onPress }) => {
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const handleDismiss = () => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(alert.id);
    });
  };

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'error':
        return {
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444',
          iconColor: '#EF4444',
          textColor: '#991B1B',
        };
      case 'warning':
        return {
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
          iconColor: '#F59E0B',
          textColor: '#92400E',
        };
      case 'success':
        return {
          backgroundColor: '#D1FAE5',
          borderColor: '#10B981',
          iconColor: '#10B981',
          textColor: '#065F46',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#DBEAFE',
          borderColor: '#3B82F6',
          iconColor: '#3B82F6',
          textColor: '#1E40AF',
        };
    }
  };

  const alertStyles = getAlertStyles();

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: alertStyles.backgroundColor,
          borderColor: alertStyles.borderColor,
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={() => onPress?.(alert)} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getAlertIcon()}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: alertStyles.textColor }]}>{alert.title}</Text>
          <Text style={[styles.message, { color: alertStyles.textColor }]}>{alert.message}</Text>
          <Text style={[styles.timestamp, { color: alertStyles.textColor }]}>
            {formatRelativeTime(alert.timestamp)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.dismissText, { color: alertStyles.textColor }]}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  dismissButton: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  dismissText: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 24,
  },
});

export default AlertBanner;
