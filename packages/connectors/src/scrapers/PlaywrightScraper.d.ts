export interface ScrapingOptions {
    headless?: boolean;
    timeout?: number;
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
    browser?: 'chromium' | 'firefox' | 'webkit';
    waitForSelector?: string;
    waitForNetworkIdle?: boolean;
    screenshot?: boolean;
    retries?: number;
}
export interface ScrapingResult {
    html: string;
    text: string;
    url: string;
    title: string;
    screenshot?: Buffer;
    metadata: {
        loadTime: number;
        statusCode: number;
        headers: Record<string, string>;
    };
}
/**
 * Playwright-based web scraper for fallback dashboard access
 * Used when API access is unavailable or limited
 */
export declare class PlaywrightScraper {
    private browser;
    private browserType;
    private defaultOptions;
    constructor(options?: ScrapingOptions);
    /**
     * Initialize the browser
     */
    private initBrowser;
    /**
     * Create a new page with common settings
     */
    private createPage;
    /**
     * Scrape a single URL
     */
    scrape(url: string, options?: Partial<ScrapingOptions>): Promise<ScrapingResult>;
    /**
     * Scrape multiple URLs concurrently
     */
    scrapeMultiple(urls: string[], options?: Partial<ScrapingOptions>, concurrency?: number): Promise<ScrapingResult[]>;
    /**
     * Extract specific data using CSS selectors
     */
    extractData(url: string, selectors: Record<string, string>, options?: Partial<ScrapingOptions>): Promise<Record<string, string | null>>;
    /**
     * Perform login to a dashboard
     */
    login(loginUrl: string, credentials: {
        username: string;
        password: string;
    }, selectors: {
        usernameField: string;
        passwordField: string;
        submitButton: string;
        successIndicator?: string;
    }, options?: Partial<ScrapingOptions>): Promise<{
        success: boolean;
        cookies: any[];
        sessionData?: any;
    }>;
    /**
     * Check if a page is accessible
     */
    checkAccessibility(url: string, timeout?: number): Promise<{
        accessible: boolean;
        statusCode?: number;
        loadTime: number;
        error?: string;
    }>;
    /**
     * Close the browser and cleanup resources
     */
    dispose(): Promise<void>;
    /**
     * Get browser info
     */
    getBrowserInfo(): {
        type: string;
        version: string;
        isConnected: boolean;
    };
}
//# sourceMappingURL=PlaywrightScraper.d.ts.map