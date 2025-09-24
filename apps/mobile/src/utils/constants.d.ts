export declare const API_CONFIG: {
    readonly BASE_URL: string;
    readonly WS_URL: string;
    readonly TIMEOUT: 10000;
    readonly RETRY_ATTEMPTS: 3;
};
export declare const APP_CONFIG: {
    readonly NAME: "AI Nodes Dashboard";
    readonly VERSION: "1.0.0";
    readonly MIN_REFRESH_INTERVAL: 10;
    readonly DEFAULT_REFRESH_INTERVAL: 30;
    readonly MAX_RECONNECT_ATTEMPTS: 5;
    readonly RECONNECT_INTERVAL: 5000;
};
export declare const NOTIFICATION_CHANNELS: {
    readonly DEFAULT: "default";
    readonly ALERTS: "alerts";
    readonly EARNINGS: "earnings";
};
export declare const STORAGE_KEYS: {
    readonly API_KEY: "ai_nodes_api_key";
    readonly SETTINGS: "ai_nodes_settings";
    readonly USER_PREFERENCES: "ai_nodes_user_preferences";
    readonly LAST_SYNC: "ai_nodes_last_sync";
};
export declare const CHART_COLORS: {
    readonly PRIMARY: "#10B981";
    readonly SECONDARY: "#3B82F6";
    readonly SUCCESS: "#10B981";
    readonly WARNING: "#F59E0B";
    readonly ERROR: "#EF4444";
    readonly INFO: "#6366F1";
    readonly BACKGROUND: "#1a1a2e";
    readonly GRADIENT_FROM: "#1a1a2e";
    readonly GRADIENT_TO: "#16213e";
};
export declare const STATUS_COLORS: {
    readonly ONLINE: "#10B981";
    readonly OFFLINE: "#EF4444";
    readonly MAINTENANCE: "#F59E0B";
    readonly UNKNOWN: "#6B7280";
};
export declare const PERFORMANCE_THRESHOLDS: {
    readonly EXCELLENT: 90;
    readonly GOOD: 70;
    readonly POOR: 50;
};
export declare const TIME_RANGES: {
    readonly '24h': {
        readonly label: "24 Hours";
        readonly hours: 24;
    };
    readonly '7d': {
        readonly label: "7 Days";
        readonly hours: number;
    };
    readonly '30d': {
        readonly label: "30 Days";
        readonly hours: number;
    };
    readonly '3m': {
        readonly label: "3 Months";
        readonly hours: number;
    };
};
export declare const NODE_TYPES: {
    readonly GPU: "GPU";
    readonly CPU: "CPU";
    readonly STORAGE: "STORAGE";
};
export declare const DEFAULT_SETTINGS: {
    readonly autoReinvest: false;
    readonly reinvestThreshold: 100;
    readonly notifications: {
        readonly enabled: true;
        readonly nodeOffline: true;
        readonly earningsTarget: true;
        readonly lowPerformance: true;
    };
    readonly refreshInterval: 30;
};
export declare const ANIMATION_DURATION: {
    readonly FAST: 200;
    readonly NORMAL: 300;
    readonly SLOW: 500;
};
export declare const SCREEN_PADDING = 16;
export declare const CARD_MARGIN = 8;
export declare const BORDER_RADIUS = 8;
//# sourceMappingURL=constants.d.ts.map