import * as Notifications from 'expo-notifications';
export declare class NotificationService {
  private static instance;
  private expoPushToken;
  static getInstance(): NotificationService;
  initialize(): Promise<string | null>;
  scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    channelId?: string,
  ): Promise<string>;
  scheduleNodeOfflineAlert(nodeName: string, nodeId: string): Promise<string>;
  scheduleEarningsAlert(amount: number, target: number): Promise<string>;
  scheduleLowPerformanceAlert(nodeName: string, performance: number): Promise<string>;
  scheduleReinvestComplete(amount: number): Promise<string>;
  cancelNotification(identifier: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  getBadgeCount(): Promise<number>;
  setBadgeCount(count: number): Promise<void>;
  clearBadge(): Promise<void>;
  getExpoPushToken(): string | null;
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void,
  ): any;
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void,
  ): any;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notifications.d.ts.map
