export declare class WebSocketService {
    private ws;
    private url;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectInterval;
    private listeners;
    private isConnecting;
    constructor(url?: string);
    connect(apiKey: string): Promise<void>;
    private handleMessage;
    private handleReconnect;
    subscribe(messageType: string, listener: (data: any) => void): () => void;
    unsubscribe(messageType: string, listener?: (data: any) => void): void;
    send(message: any): void;
    disconnect(): void;
    getConnectionState(): 'connecting' | 'connected' | 'disconnected';
}
export declare const webSocketService: WebSocketService;
//# sourceMappingURL=websocket.d.ts.map