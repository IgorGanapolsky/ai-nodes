export declare class SecureStorage {
    static setApiKey(apiKey: string): Promise<void>;
    static getApiKey(): Promise<string | null>;
    static removeApiKey(): Promise<void>;
    static setSettings(settings: object): Promise<void>;
    static getSettings<T>(): Promise<T | null>;
    static setUserPreferences(preferences: object): Promise<void>;
    static getUserPreferences<T>(): Promise<T | null>;
    static clearAll(): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map