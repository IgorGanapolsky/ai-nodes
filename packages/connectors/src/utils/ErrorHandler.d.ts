import { ConnectorError } from '../interfaces/types';
/**
 * Comprehensive error handling for connectors
 */
export declare class ErrorHandler {
    /**
     * Create a standardized ConnectorError
     */
    static createError(code: string, message: string, details?: any, retryable?: boolean): ConnectorError;
    /**
     * Wrap and standardize API errors
     */
    static wrapApiError(error: any, context?: string): ConnectorError;
    /**
     * Handle scraper errors
     */
    static wrapScraperError(error: any, context?: string): ConnectorError;
    /**
     * Handle cache errors
     */
    static wrapCacheError(error: any, operation: string): ConnectorError;
    /**
     * Handle validation errors
     */
    static createValidationError(field: string, value: any, reason: string): ConnectorError;
    /**
     * Handle configuration errors
     */
    static createConfigError(message: string, details?: any): ConnectorError;
    /**
     * Handle timeout errors
     */
    static createTimeoutError(operation: string, timeout: number): ConnectorError;
    /**
     * Check if an error indicates a temporary issue
     */
    static isTemporaryError(error: Error): boolean;
    /**
     * Get error classification
     */
    static classifyError(error: Error): {
        category: 'network' | 'auth' | 'validation' | 'config' | 'server' | 'client' | 'unknown';
        severity: 'low' | 'medium' | 'high' | 'critical';
        retryable: boolean;
    };
}
//# sourceMappingURL=ErrorHandler.d.ts.map