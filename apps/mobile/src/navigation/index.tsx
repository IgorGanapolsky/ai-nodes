import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../types';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import EarningsScreen from '../screens/EarningsScreen';
import NodesScreen from '../screens/NodesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} />,
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="earnings" color={color} size={size} />,
          title: 'Earnings',
        }}
      />
      <Tab.Screen
        name="Nodes"
        component={NodesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="nodes" color={color} size={size} />,
          title: 'Nodes',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon component using text icons

const TabIcon: React.FC<{ name: string; color: string; size: number }> = ({
  name,
  color,
  size,
}) => {
  const getIcon = () => {
    switch (name) {
      case 'dashboard':
        return '📊';
      case 'earnings':
        return '💰';
      case 'nodes':
        return '🖥️';
      case 'settings':
        return '⚙️';
      default:
        return '📱';
    }
  };

  return <Text style={{ fontSize: size, textAlign: 'center' }}>{getIcon()}</Text>;
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
