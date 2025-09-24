import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import ErrorBoundary from './src/components/ErrorBoundary';
export default function App() {
    return (<ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="light" backgroundColor="#1a1a2e"/>
      </SafeAreaProvider>
    </ErrorBoundary>);
}
