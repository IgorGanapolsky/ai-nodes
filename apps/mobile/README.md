# AI Nodes Dashboard - React Native Mobile App

A comprehensive React Native Expo application for monitoring and managing AI compute nodes with real-time metrics, earnings tracking, and automated reinvestment features.

## Features

### 🏠 Dashboard

- Real-time node status monitoring
- Live earnings overview with growth indicators
- WebSocket connection status
- Auto-reinvest progress tracking
- Recent node performance summaries

### 💰 Earnings Management

- Interactive earnings charts with multiple time ranges (24h, 7d, 30d, 3m)
- Real-time earnings updates via WebSocket
- Auto-reinvest configuration and manual triggers
- Detailed transaction history
- Reinvestment success tracking

### 🖥️ Node Management

- Add, edit, and delete nodes
- Filter nodes by status (online, offline, maintenance)
- Detailed node metrics and performance data
- Node-specific earnings tracking
- Real-time status updates

### ⚙️ Settings & Configuration

- Secure API key management with validation
- Auto-reinvest threshold configuration
- Granular notification preferences
- App refresh interval settings
- Data reset and backup options

### 🔔 Push Notifications

- Node offline alerts
- Earnings target notifications
- Low performance warnings
- Auto-reinvest completion updates
- Customizable notification preferences

## Technical Stack

- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **Charts**: react-native-chart-kit
- **Notifications**: expo-notifications
- **Secure Storage**: expo-secure-store
- **Real-time Updates**: WebSocket integration
- **State Management**: Custom hooks with React Context

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── NodeCard.tsx     # Node display card
│   ├── EarningsChart.tsx # Chart component
│   ├── AlertBanner.tsx  # Notification banner
│   └── ErrorBoundary.tsx # Error handling
├── screens/             # Main application screens
│   ├── DashboardScreen.tsx
│   ├── EarningsScreen.tsx
│   ├── NodesScreen.tsx
│   └── SettingsScreen.tsx
├── navigation/          # Navigation configuration
├── hooks/               # Custom React hooks
│   ├── useNodes.ts      # Node management
│   ├── useEarnings.ts   # Earnings data
│   ├── useSettings.ts   # App settings
│   └── useReinvest.ts   # Auto-reinvest logic
├── services/            # External service integrations
│   ├── websocket.ts     # WebSocket client
│   └── notifications.ts # Push notifications
├── utils/               # Utility functions
│   ├── api.ts           # API client
│   ├── formatters.ts    # Data formatting
│   └── storage.ts       # Secure storage
└── types/               # TypeScript definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator
- Expo Go app (for physical device testing)

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm start
   ```

3. **Run on specific platforms**:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

### Configuration

1. **API Setup**:
   - Obtain your API key from the AI Nodes service
   - Configure the API key in the Settings screen
   - Validate the connection

2. **Notifications**:
   - Enable push notifications in device settings
   - Configure notification preferences in the app
   - Test with the Expo Go app or a development build

## Key Features Implementation

### Real-time Updates

The app uses WebSocket connections to provide real-time updates for:

- Node status changes
- Live earnings data
- Performance metrics
- Auto-reinvest completion

### Secure Storage

All sensitive data is stored using Expo's secure storage:

- API keys are encrypted
- Settings are persisted securely
- Automatic data cleanup on logout

### Auto-reinvest Logic

Intelligent reinvestment system that:

- Monitors earnings against configurable thresholds
- Triggers automatic reinvestment
- Provides manual override capabilities
- Tracks success/failure rates

### Error Handling

Comprehensive error handling including:

- Global error boundary for crash recovery
- Network error handling with retry logic
- User-friendly error messages
- Development mode error details

## Performance Optimizations

- **Lazy Loading**: Components are loaded on demand
- **Memoization**: Expensive calculations are cached
- **Efficient Re-renders**: Custom hooks prevent unnecessary updates
- **Image Optimization**: Assets are optimized for mobile
- **Background Updates**: WebSocket maintains connection efficiently

## Security Features

- **Secure API Key Storage**: Keys are encrypted at rest
- **Certificate Pinning**: API calls use secure connections
- **Input Validation**: All user inputs are sanitized
- **Error Sanitization**: Sensitive data is not exposed in errors

## Development

### Custom Hooks

The app uses custom hooks for state management:

- `useNodes`: Manages node data and operations
- `useEarnings`: Handles earnings calculations and charts
- `useSettings`: Manages app configuration
- `useReinvest`: Controls auto-reinvest functionality

### API Integration

The API client provides:

- Automatic retry logic
- Error handling and user feedback
- Request/response logging (development)
- Authentication management

### Testing

Run tests with:

```bash
npm test
```

## Building for Production

### iOS

```bash
npm run build:ios
```

### Android

```bash
npm run build:android
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check internet connection
   - Verify API key validity
   - Restart the app

2. **Notifications Not Working**
   - Enable notifications in device settings
   - Check Expo notification permissions
   - Verify push token registration

3. **Charts Not Displaying**
   - Ensure react-native-svg is properly linked
   - Check data format compatibility
   - Verify chart dimensions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Check the troubleshooting section
- Review the API documentation
- Contact the development team

---

Built with ❤️ using React Native and Expo
