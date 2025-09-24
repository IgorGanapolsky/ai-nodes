import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
export class NotificationService {
    static instance;
    expoPushToken = null;
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    async initialize() {
        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return null;
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Permission not granted for notifications');
            return null;
        }
        try {
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            this.expoPushToken = token.data;
            console.log('Expo push token:', token.data);
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
                await Notifications.setNotificationChannelAsync('alerts', {
                    name: 'Node Alerts',
                    importance: Notifications.AndroidImportance.HIGH,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                    sound: 'default',
                });
                await Notifications.setNotificationChannelAsync('earnings', {
                    name: 'Earnings Updates',
                    importance: Notifications.AndroidImportance.DEFAULT,
                    vibrationPattern: [0, 250],
                    lightColor: '#00FF00',
                });
            }
            return this.expoPushToken;
        }
        catch (error) {
            console.error('Failed to get push token:', error);
            return null;
        }
    }
    async scheduleLocalNotification(title, body, data, channelId = 'default') {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: null,
            identifier: channelId,
        });
    }
    async scheduleNodeOfflineAlert(nodeName, nodeId) {
        return this.scheduleLocalNotification('Node Offline', `${nodeName} has gone offline. Check your node status.`, { type: 'node_offline', nodeId }, 'alerts');
    }
    async scheduleEarningsAlert(amount, target) {
        return this.scheduleLocalNotification('Earnings Target Reached', `You've earned $${amount.toFixed(2)}! Target: $${target.toFixed(2)}`, { type: 'earnings_target', amount, target }, 'earnings');
    }
    async scheduleLowPerformanceAlert(nodeName, performance) {
        return this.scheduleLocalNotification('Low Performance Warning', `${nodeName} performance is at ${performance}%. Consider maintenance.`, { type: 'low_performance', nodeName, performance }, 'alerts');
    }
    async scheduleReinvestComplete(amount) {
        return this.scheduleLocalNotification('Auto-Reinvest Complete', `Successfully reinvested $${amount.toFixed(2)} into new nodes.`, { type: 'reinvest_complete', amount }, 'earnings');
    }
    async cancelNotification(identifier) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
    async getBadgeCount() {
        return await Notifications.getBadgeCountAsync();
    }
    async setBadgeCount(count) {
        await Notifications.setBadgeCountAsync(count);
    }
    async clearBadge() {
        await Notifications.setBadgeCountAsync(0);
    }
    getExpoPushToken() {
        return this.expoPushToken;
    }
    addNotificationReceivedListener(listener) {
        return Notifications.addNotificationReceivedListener(listener);
    }
    addNotificationResponseReceivedListener(listener) {
        return Notifications.addNotificationResponseReceivedListener(listener);
    }
}
export const notificationService = NotificationService.getInstance();
