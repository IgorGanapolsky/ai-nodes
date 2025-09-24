export class WebSocketService {
    ws = null;
    url;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectInterval = 5000;
    listeners = new Map();
    isConnecting = false;
    constructor(url = 'wss://api.ai-nodes.com/ws') {
        this.url = url;
    }
    connect(apiKey) {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            if (this.isConnecting) {
                reject(new Error('Connection already in progress'));
                return;
            }
            this.isConnecting = true;
            try {
                this.ws = new WebSocket(`${this.url}?token=${apiKey}`);
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    resolve();
                };
                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    }
                    catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };
                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnecting = false;
                    this.handleReconnect();
                };
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    reject(error);
                };
            }
            catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }
    handleMessage(message) {
        const listeners = this.listeners.get(message.type);
        if (listeners) {
            listeners.forEach(listener => listener(message.data));
        }
        // Global listeners
        const globalListeners = this.listeners.get('*');
        if (globalListeners) {
            globalListeners.forEach(listener => listener(message));
        }
    }
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                // Note: This would need the API key to be stored/passed somehow
                // In a real implementation, you'd get this from storage or context
                this.connect(''); // This would need proper API key handling
            }, this.reconnectInterval * this.reconnectAttempts);
        }
        else {
            console.error('Max reconnection attempts reached');
        }
    }
    subscribe(messageType, listener) {
        if (!this.listeners.has(messageType)) {
            this.listeners.set(messageType, new Set());
        }
        this.listeners.get(messageType).add(listener);
        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(messageType);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.listeners.delete(messageType);
                }
            }
        };
    }
    unsubscribe(messageType, listener) {
        if (listener) {
            const listeners = this.listeners.get(messageType);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.listeners.delete(messageType);
                }
            }
        }
        else {
            this.listeners.delete(messageType);
        }
    }
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
        else {
            console.warn('WebSocket is not connected');
        }
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.listeners.clear();
        this.reconnectAttempts = 0;
        this.isConnecting = false;
    }
    getConnectionState() {
        if (this.isConnecting)
            return 'connecting';
        if (this.ws?.readyState === WebSocket.OPEN)
            return 'connected';
        return 'disconnected';
    }
}
export const webSocketService = new WebSocketService();
