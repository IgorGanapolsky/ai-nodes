# Development Guide - AI Nodes Dashboard Mobile App

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)

### Running the App

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm start
   ```

3. **Run on platforms**:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## Development Workflow

### Code Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Main app screens
├── navigation/     # Navigation configuration
├── hooks/          # Custom React hooks
├── services/       # External services (API, WebSocket, notifications)
├── utils/          # Utilities and helpers
└── types/          # TypeScript type definitions
```

### Key Development Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Build for production
npm run build
```

### API Integration

The app connects to the AI Nodes API. For development:

1. **Mock API**: Use the built-in mock responses when no API key is configured
2. **Development API**: Set up a local API server for testing
3. **Staging API**: Use staging environment for testing

Environment variables:

```bash
EXPO_PUBLIC_API_URL=https://api.ai-nodes.com/v1
EXPO_PUBLIC_WS_URL=wss://api.ai-nodes.com/ws
```

### Testing

#### Unit Tests

```bash
npm run test
```

#### Integration Testing

- Use Expo Go app for real device testing
- Test WebSocket connections in different network conditions
- Validate push notifications on physical devices

#### E2E Testing

- Use `detox` for E2E testing (setup required)
- Test critical user flows: login, node management, earnings tracking

### Debugging

#### React Native Debugger

1. Install React Native Debugger
2. Enable debugging in Expo Dev Tools
3. Use Redux DevTools for state inspection

#### Network Debugging

- Use Charles Proxy or similar for API inspection
- Monitor WebSocket connections
- Check notification payload delivery

#### Performance Profiling

- Use Flipper for performance monitoring
- Monitor memory usage with React DevTools Profiler
- Check app startup time and bundle size

### State Management

The app uses custom hooks for state management:

- `useNodes`: Node data and operations
- `useEarnings`: Earnings calculations and charts
- `useSettings`: App configuration
- `useReinvest`: Auto-reinvest logic

#### Adding New State

1. Create custom hook in `src/hooks/`
2. Use TypeScript interfaces for type safety
3. Implement error handling and loading states
4. Add WebSocket subscriptions for real-time updates

### UI Development

#### Design System

- Colors: Use predefined color constants
- Typography: Follow material design guidelines
- Spacing: Use consistent padding/margins
- Components: Build reusable, composable components

#### Chart Integration

Using `react-native-chart-kit`:

- Line charts for trends
- Bar charts for comparisons
- Custom styling with theme colors
- Responsive sizing for different screen sizes

### Real-time Features

#### WebSocket Implementation

```typescript
// Subscribe to node updates
const unsubscribe = webSocketService.subscribe('node_update', (data) => {
  // Handle node update
});

// Clean up subscription
useEffect(() => unsubscribe, []);
```

#### Push Notifications

```typescript
// Schedule notification
await notificationService.scheduleNodeOfflineAlert(nodeName, nodeId);

// Handle notification response
notificationService.addNotificationResponseReceivedListener((response) => {
  // Navigate to relevant screen
});
```

### Security Considerations

#### API Key Storage

- Use `expo-secure-store` for sensitive data
- Never log API keys in development
- Validate API keys before storage

#### Network Security

- Use HTTPS for all API calls
- Implement certificate pinning for production
- Validate all server responses

#### Data Sanitization

- Sanitize user inputs
- Escape data before display
- Validate data types and ranges

### Performance Optimization

#### Bundle Size

- Use dynamic imports for large components
- Optimize images and assets
- Remove unused dependencies

#### Memory Management

- Clean up event listeners and subscriptions
- Use React.memo for expensive components
- Implement proper cleanup in useEffect

#### Network Optimization

- Implement request caching
- Use pagination for large datasets
- Minimize API calls with smart batching

### Common Issues & Solutions

#### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start --clear

# Reset project
npx expo install --fix
```

#### iOS Simulator Issues

```bash
# Reset iOS Simulator
xcrun simctl erase all

# Rebuild iOS app
npx expo run:ios --clear
```

#### Android Build Issues

```bash
# Clean Gradle cache
cd android && ./gradlew clean

# Reset Android project
npx expo run:android --clear
```

#### WebSocket Connection Issues

- Check network connectivity
- Verify API key validity
- Monitor connection state in logs
- Implement proper reconnection logic

#### Notification Issues

- Ensure proper permissions
- Test on physical devices
- Check notification channel configuration
- Verify push token registration

### Adding New Features

#### Screen Development

1. Create screen component in `src/screens/`
2. Add to navigation configuration
3. Implement loading and error states
4. Add proper TypeScript types

#### Component Development

1. Create in `src/components/`
2. Follow atomic design principles
3. Add proper prop types
4. Include documentation comments

#### Hook Development

1. Create in `src/hooks/`
2. Use proper dependency arrays
3. Implement cleanup functions
4. Add error handling

### Code Style & Standards

#### TypeScript

- Use strict mode
- Define proper interfaces
- Avoid `any` type
- Use proper generics

#### React

- Use functional components
- Implement proper prop types
- Use meaningful component names
- Follow React best practices

#### Styling

- Use StyleSheet.create for styles
- Follow consistent naming
- Use relative units when possible
- Implement responsive design

### Deployment

#### Development Build

```bash
eas build --profile development
```

#### Production Build

```bash
eas build --profile production
```

#### App Store Submission

1. Test on multiple devices
2. Validate all features work offline
3. Check App Store guidelines compliance
4. Submit via EAS Submit

### Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

### Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Charts](https://github.com/indiespirit/react-native-chart-kit)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

For additional help, check the main README.md or contact the development team.
