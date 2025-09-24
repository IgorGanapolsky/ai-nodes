import { ConnectorError } from '../interfaces/types';
/**
 * Comprehensive error handling for connectors
 */
export class ErrorHandler {
    /**
     * Create a standardized ConnectorError
     */
    static createError(code, message, details, retryable = false) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.retryable = retryable;
        error.name = 'ConnectorError';
        return error;
    }
    /**
     * Wrap and standardize API errors
     */
    static wrapApiError(error, context) {
        if (error instanceof ConnectorError) {
            return error;
        }
        let code = 'API_ERROR';
        let message = 'An API error occurred';
        let retryable = false;
        let details = {};
        if (error.response) {
            // HTTP response error
            const status = error.response.status;
            const statusText = error.response.statusText;
            const data = error.response.data;
            code = `HTTP_${status}`;
            message = `HTTP ${status}: ${statusText}`;
            retryable = status >= 500 && status < 600; // Server errors are retryable
            details = {
                status,
                statusText,
                data,
                headers: error.response.headers
            };
            // Specific status code handling
            switch (status) {
                case 401:
                    code = 'AUTHENTICATION_ERROR';
                    message = 'Authentication failed - invalid or expired credentials';
                    break;
                case 403:
                    code = 'AUTHORIZATION_ERROR';
                    message = 'Authorization failed - insufficient permissions';
                    break;
                case 429:
                    code = 'RATE_LIMIT_ERROR';
                    message = 'Rate limit exceeded';
                    retryable = true;
                    break;
                case 503:
                    code = 'SERVICE_UNAVAILABLE';
                    message = 'Service temporarily unavailable';
                    retryable = true;
                    break;
            }
        }
        else if (error.request) {
            // Network error
            code = 'NETWORK_ERROR';
            message = 'Network request failed';
            retryable = true;
            details = {
                timeout: error.timeout,
                code: error.code
            };
        }
        else {
            // General error
            message = error.message || 'Unknown error occurred';
            details = {
                originalError: error.toString()
            };
        }
        if (context) {
            message = `${context}: ${message}`;
            details.context = context;
        }
        return this.createError(code, message, details, retryable);
    }
    /**
     * Handle scraper errors
     */
    static wrapScraperError(error, context) {
        let code = 'SCRAPER_ERROR';
        let message = 'Web scraping failed';
        let retryable = true; // Most scraper errors are retryable
        if (error.message) {
            if (error.message.includes('timeout')) {
                code = 'SCRAPER_TIMEOUT';
                message = 'Web scraping timed out';
            }
            else if (error.message.includes('Page crashed')) {
                code = 'SCRAPER_CRASH';
                message = 'Browser page crashed during scraping';
            }
            else if (error.message.includes('Navigation failed')) {
                code = 'SCRAPER_NAVIGATION_FAILED';
                message = 'Failed to navigate to target page';
            }
            else {
                message = error.message;
            }
        }
        if (context) {
            message = `${context}: ${message}`;
        }
        return this.createError(code, message, { originalError: error }, retryable);
    }
    /**
     * Handle cache errors
     */
    static wrapCacheError(error, operation) {
        const code = 'CACHE_ERROR';
        const message = `Cache ${operation} failed: ${error.message || 'Unknown error'}`;
        return this.createError(code, message, {
            operation,
            originalError: error
        }, false); // Cache errors are typically not retryable
    }
    /**
     * Handle validation errors
     */
    static createValidationError(field, value, reason) {
        const code = 'VALIDATION_ERROR';
        const message = `Validation failed for field '${field}': ${reason}`;
        return this.createError(code, message, {
            field,
            value,
            reason
        }, false);
    }
    /**
     * Handle configuration errors
     */
    static createConfigError(message, details) {
        const code = 'CONFIG_ERROR';
        return this.createError(code, message, details, false);
    }
    /**
     * Handle timeout errors
     */
    static createTimeoutError(operation, timeout) {
        const code = 'TIMEOUT_ERROR';
        const message = `Operation '${operation}' timed out after ${timeout}ms`;
        return this.createError(code, message, {
            operation,
            timeout
        }, true);
    }
    /**
     * Check if an error indicates a temporary issue
     */
    static isTemporaryError(error) {
        if (error instanceof ConnectorError) {
            return error.retryable;
        }
        const message = error.message.toLowerCase();
        const temporaryPatterns = [
            'timeout',
            'econnreset',
            'enotfound',
            'service unavailable',
            'rate limit',
            'too many requests',
            'temporarily unavailable'
        ];
        return temporaryPatterns.some(pattern => message.includes(pattern));
    }
    /**
     * Get error classification
     */
    static classifyError(error) {
        if (error instanceof ConnectorError) {
            const code = error.code;
            if (code.includes('NETWORK') || code.includes('TIMEOUT')) {
                return { category: 'network', severity: 'medium', retryable: true };
            }
            if (code.includes('AUTH')) {
                return { category: 'auth', severity: 'high', retryable: false };
            }
            if (code.includes('VALIDATION') || code.includes('CONFIG')) {
                return { category: 'validation', severity: 'medium', retryable: false };
            }
            if (code.includes('HTTP_5')) {
                return { category: 'server', severity: 'medium', retryable: true };
            }
            if (code.includes('HTTP_4')) {
                return { category: 'client', severity: 'medium', retryable: false };
            }
        }
        return { category: 'unknown', severity: 'low', retryable: false };
    }
}
