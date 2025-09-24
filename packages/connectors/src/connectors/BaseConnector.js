import axios from 'axios';
import { RateLimiter, RetryLogic, ErrorHandler, MockDataGenerator } from '../utils';
import { CacheManager } from '../cache';
import { PlaywrightScraper } from '../scrapers';
/**
 * Base connector class implementing common functionality
 * All specific connectors extend this class
 */
export class BaseConnector {
    type;
    config;
    axiosInstance;
    rateLimiter;
    cacheManager;
    scraper;
    initialized = false;
    constructor(type, config) {
        this.type = type;
        this.config = {
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000,
            rateLimit: {
                requests: 60,
                window: 60000 // 1 minute
            },
            cache: {
                enabled: true,
                ttl: 300 // 5 minutes
            },
            scraper: {
                enabled: false,
                headless: true,
                timeout: 30000
            },
            ...config
        };
        // Initialize HTTP client
        this.axiosInstance = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'User-Agent': 'AI-Nodes-Connector/1.0.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            }
        });
        // Setup request/response interceptors
        this.setupInterceptors();
        // Initialize rate limiter
        this.rateLimiter = new RateLimiter(this.config.rateLimit.requests, this.config.rateLimit.requests / (this.config.rateLimit.window / 1000));
        // Initialize cache manager
        this.cacheManager = new CacheManager(this.config.cache.ttl);
        // Initialize scraper if enabled
        if (this.config.scraper?.enabled) {
            this.scraper = new PlaywrightScraper({
                headless: this.config.scraper.headless,
                timeout: this.config.scraper.timeout
            });
        }
    }
    /**
     * Setup axios interceptors for error handling and rate limiting
     */
    setupInterceptors() {
        // Request interceptor for rate limiting
        this.axiosInstance.interceptors.request.use(async (config) => {
            await this.rateLimiter.acquire();
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.axiosInstance.interceptors.response.use((response) => response, (error) => {
            throw ErrorHandler.wrapApiError(error, `${this.type} API Error`);
        });
    }
    /**
     * Initialize the connector
     */
    async initialize(config) {
        // Update configuration
        Object.assign(this.config, config);
        // Validate configuration
        await this.validateConfig();
        // Perform connector-specific initialization
        await this.doInitialize();
        this.initialized = true;
    }
    /**
     * Validate connector configuration
     */
    async validateConfig() {
        if (this.requiresApiKey() && !this.config.apiKey) {
            throw ErrorHandler.createConfigError('API key is required but not provided', { connector: this.type });
        }
        if (!this.config.baseUrl && this.requiresBaseUrl()) {
            throw ErrorHandler.createConfigError('Base URL is required but not provided', { connector: this.type });
        }
    }
    /**
     * Make a cached API request
     */
    async makeRequest(method, url, data, cacheTtl) {
        if (!this.initialized) {
            throw ErrorHandler.createError('CONNECTOR_NOT_INITIALIZED', 'Connector not initialized', {}, false);
        }
        const cacheKey = { method, url, data };
        // Try cache first if enabled
        if (this.config.cache?.enabled) {
            const cached = await this.cacheManager.get(this.type, method, cacheKey);
            if (cached !== null) {
                return cached;
            }
        }
        // Make API request with retry logic
        const response = await RetryLogic.execute(async () => {
            const config = {
                method: method,
                url,
                ...(data && { data })
            };
            const result = await this.axiosInstance.request(config);
            return result.data;
        }, {
            retries: this.config.retryAttempts,
            minTimeout: this.config.retryDelay
        });
        // Cache the response if enabled
        if (this.config.cache?.enabled) {
            await this.cacheManager.set(this.type, method, response, cacheTtl || this.config.cache.ttl, cacheKey);
        }
        return response;
    }
    /**
     * Fallback to scraping when API is not available
     */
    async scrapeData(url, selectors, options) {
        if (!this.scraper) {
            throw ErrorHandler.createError('SCRAPER_NOT_ENABLED', 'Scraper is not enabled for this connector', { connector: this.type }, false);
        }
        return this.scraper.extractData(url, selectors, options);
    }
    /**
     * Check if connector is ready
     */
    async isReady() {
        if (!this.initialized) {
            return false;
        }
        try {
            const health = await this.getHealth();
            return health.status === 'healthy';
        }
        catch {
            return false;
        }
    }
    /**
     * Get connector health
     */
    async getHealth() {
        const startTime = Date.now();
        const errors = [];
        let status = 'healthy';
        try {
            // Try to validate credentials
            const credentialsValid = await this.validateCredentials();
            if (!credentialsValid.valid) {
                errors.push('Invalid credentials');
                status = 'unhealthy';
            }
            // Check rate limiting
            const rateLimitInfo = this.rateLimiter.getInfo();
            if (rateLimitInfo.remaining < rateLimitInfo.limit * 0.1) {
                errors.push('Rate limit nearly exhausted');
                status = status === 'healthy' ? 'degraded' : status;
            }
        }
        catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            status = 'unhealthy';
        }
        const latency = Date.now() - startTime;
        return {
            status,
            lastCheck: new Date(),
            latency,
            errors
        };
    }
    /**
     * Generate mock data when API is not available
     */
    generateMockNodeStatus(nodeId) {
        if (nodeId) {
            const status = MockDataGenerator.generateNodeStatus(this.type);
            status.id = nodeId;
            return status;
        }
        return MockDataGenerator.generateMultipleNodeStatuses(this.type, 3);
    }
    /**
     * Generate mock earnings data
     */
    generateMockEarnings(period) {
        return MockDataGenerator.generateEarnings(period, this.type);
    }
    /**
     * Generate mock metrics data
     */
    generateMockMetrics(nodeId) {
        if (nodeId) {
            return MockDataGenerator.generateNodeMetrics(this.type);
        }
        return MockDataGenerator.generateMultipleNodeMetrics(this.type, 3);
    }
    /**
     * Generate mock pricing strategy
     */
    generateMockPricingStrategy() {
        return MockDataGenerator.generatePricingStrategy(this.type);
    }
    /**
     * Check if connector should use mock data
     */
    shouldUseMockData() {
        // Use mock data in development or when API is not available
        return process.env.NODE_ENV === 'development' ||
            process.env.USE_MOCK_DATA === 'true' ||
            !this.config.apiKey;
    }
    /**
     * Dispose of resources
     */
    async dispose() {
        if (this.scraper) {
            await this.scraper.dispose();
        }
        this.cacheManager.dispose();
        this.initialized = false;
    }
    /**
     * Get connector information
     */
    getInfo() {
        return {
            type: this.type,
            initialized: this.initialized,
            hasApiKey: !!this.config.apiKey,
            cacheEnabled: !!this.config.cache?.enabled,
            scraperEnabled: !!this.config.scraper?.enabled,
            rateLimitInfo: this.rateLimiter.getInfo()
        };
    }
}
