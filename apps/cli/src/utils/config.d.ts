export interface Config {
    apiUrl: string;
    apiKey?: string;
    defaultOwnerId?: string;
    verbose?: boolean;
    timeout?: number;
    notifications?: {
        email?: boolean;
        slack?: boolean;
        webhookUrl?: string;
    };
    thresholds?: {
        lowUtilization: number;
        highUtilization: number;
        offlineAlert: number;
    };
}
export declare function readConfig(): Config;
export declare function writeConfig(config: Partial<Config>): void;
export declare function validateConfig(config: Partial<Config>): string[];
export declare function getConfigPath_exported(): string;
export declare function configExists(): boolean;
export declare function resetConfig(): void;
export declare function displayConfig(): void;
//# sourceMappingURL=config.d.ts.map