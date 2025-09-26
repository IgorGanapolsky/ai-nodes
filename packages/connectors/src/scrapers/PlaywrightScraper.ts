import { Browser, Page, chromium, firefox, webkit, BrowserType } from 'playwright';
import { ErrorHandler } from '../utils/ErrorHandler';
import { RetryLogic } from '../utils/RetryLogic';

export interface ScrapingOptions {
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
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
export class PlaywrightScraper {
  private browser: Browser | null = null;
  private browserType: BrowserType;
  private defaultOptions: Required<ScrapingOptions>;

  constructor(options: ScrapingOptions = {}) {
    this.defaultOptions = {
      headless: true,
      timeout: 30000,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      browser: 'chromium',
      waitForSelector: '',
      waitForNetworkIdle: false,
      screenshot: false,
      retries: 3,
      ...options,
    };

    // Select browser type
    switch (this.defaultOptions.browser) {
      case 'firefox':
        this.browserType = firefox;
        break;
      case 'webkit':
        this.browserType = webkit;
        break;
      default:
        this.browserType = chromium;
    }
  }

  /**
   * Initialize the browser
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;

    try {
      this.browser = await this.browserType.launch({
        headless: this.defaultOptions.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    } catch (error) {
      throw ErrorHandler.wrapScraperError(error, 'Browser initialization failed');
    }
  }

  /**
   * Create a new page with common settings
   */
  private async createPage(): Promise<Page> {
    await this.initBrowser();
    if (!this.browser) {
      throw ErrorHandler.createError('SCRAPER_ERROR', 'Browser not initialized', {}, false);
    }

    const page = await this.browser.newPage({
      userAgent: this.defaultOptions.userAgent,
      viewport: this.defaultOptions.viewport,
    });

    // Set default timeout
    page.setDefaultTimeout(this.defaultOptions.timeout);

    // Add request interception for optimization
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();

      // Block unnecessary resources to speed up loading
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    return page;
  }

  /**
   * Scrape a single URL
   */
  async scrape(url: string, options: Partial<ScrapingOptions> = {}): Promise<ScrapingResult> {
    const config = { ...this.defaultOptions, ...options };

    return RetryLogic.execute(
      async () => {
        const startTime = Date.now();
        let page: Page | null = null;

        try {
          page = await this.createPage();

          // Navigate to URL
          const response = await page.goto(url, {
            waitUntil: config.waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
            timeout: config.timeout,
          });

          if (!response) {
            throw ErrorHandler.createError('SCRAPER_ERROR', 'No response received', { url }, true);
          }

          // Wait for specific selector if provided
          if (config.waitForSelector) {
            await page.waitForSelector(config.waitForSelector, {
              timeout: config.timeout,
            });
          }

          // Get page content
          const html = await page.content();
          const text = (await page.textContent('body')) || '';
          const title = await page.title();

          // Take screenshot if requested
          let screenshot: Buffer | undefined;
          if (config.screenshot) {
            screenshot = await page.screenshot({
              fullPage: true,
              type: 'png',
            });
          }

          const loadTime = Date.now() - startTime;

          return {
            html,
            text,
            url: page.url(),
            title,
            screenshot,
            metadata: {
              loadTime,
              statusCode: response.status(),
              headers: await response.allHeaders(),
            },
          };
        } catch (error) {
          throw ErrorHandler.wrapScraperError(error, `Failed to scrape ${url}`);
        } finally {
          if (page) {
            await page.close();
          }
        }
      },
      {
        retries: config.retries,
        shouldRetry: (error) => ErrorHandler.isTemporaryError(error),
      },
    );
  }

  /**
   * Scrape multiple URLs concurrently
   */
  async scrapeMultiple(
    urls: string[],
    options: Partial<ScrapingOptions> = {},
    concurrency: number = 3,
  ): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    const errors: Error[] = [];

    // Process URLs in batches to avoid overwhelming the target
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(async (url) => {
        try {
          return await this.scrape(url, options);
        } catch (error) {
          errors.push(error instanceof Error ? error : new Error(String(error)));
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...(batchResults.filter((result) => result !== null) as ScrapingResult[]));

      // Add delay between batches to be respectful
      if (i + concurrency < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw ErrorHandler.createError(
        'SCRAPER_ERROR',
        `All scraping attempts failed: ${errors.map((e) => e.message).join(', ')}`,
        { errors },
        true,
      );
    }

    return results;
  }

  /**
   * Extract specific data using CSS selectors
   */
  async extractData(
    url: string,
    selectors: Record<string, string>,
    options: Partial<ScrapingOptions> = {},
  ): Promise<Record<string, string | null>> {
    const config = { ...this.defaultOptions, ...options };

    return RetryLogic.execute(
      async () => {
        let page: Page | null = null;

        try {
          page = await this.createPage();

          await page.goto(url, {
            waitUntil: config.waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
            timeout: config.timeout,
          });

          if (config.waitForSelector) {
            await page.waitForSelector(config.waitForSelector, {
              timeout: config.timeout,
            });
          }

          const results: Record<string, string | null> = {};

          for (const [key, selector] of Object.entries(selectors)) {
            try {
              const element = await page.$(selector);
              results[key] = element ? await element.textContent() : null;
            } catch (error) {
              console.warn(`Failed to extract data for selector ${selector}:`, error);
              results[key] = null;
            }
          }

          return results;
        } catch (error) {
          throw ErrorHandler.wrapScraperError(error, `Failed to extract data from ${url}`);
        } finally {
          if (page) {
            await page.close();
          }
        }
      },
      {
        retries: config.retries,
        shouldRetry: (error) => ErrorHandler.isTemporaryError(error),
      },
    );
  }

  /**
   * Perform login to a dashboard
   */
  async login(
    loginUrl: string,
    credentials: { username: string; password: string },
    selectors: {
      usernameField: string;
      passwordField: string;
      submitButton: string;
      successIndicator?: string;
    },
    options: Partial<ScrapingOptions> = {},
  ): Promise<{ success: boolean; cookies: any[]; sessionData?: any }> {
    const config = { ...this.defaultOptions, ...options };

    return RetryLogic.execute(
      async () => {
        let page: Page | null = null;

        try {
          page = await this.createPage();

          await page.goto(loginUrl, {
            waitUntil: 'domcontentloaded',
            timeout: config.timeout,
          });

          // Fill login form
          await page.fill(selectors.usernameField, credentials.username);
          await page.fill(selectors.passwordField, credentials.password);
          await page.click(selectors.submitButton);

          // Wait for navigation or success indicator
          if (selectors.successIndicator) {
            await page.waitForSelector(selectors.successIndicator, {
              timeout: config.timeout,
            });
          } else {
            await page.waitForLoadState('domcontentloaded');
          }

          // Check if login was successful
          const currentUrl = page.url();
          const success = !currentUrl.includes('login') && !currentUrl.includes('error');

          // Get session cookies
          const cookies = await page.context().cookies();

          return {
            success,
            cookies,
            sessionData: {
              url: currentUrl,
              title: await page.title(),
            },
          };
        } catch (error) {
          throw ErrorHandler.wrapScraperError(error, 'Login failed');
        } finally {
          if (page) {
            await page.close();
          }
        }
      },
      {
        retries: config.retries,
        shouldRetry: (error) => ErrorHandler.isTemporaryError(error),
      },
    );
  }

  /**
   * Check if a page is accessible
   */
  async checkAccessibility(
    url: string,
    timeout: number = 10000,
  ): Promise<{
    accessible: boolean;
    statusCode?: number;
    loadTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      page = await this.createPage();

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout,
      });

      const loadTime = Date.now() - startTime;

      return {
        accessible: true,
        statusCode: response?.status(),
        loadTime,
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      return {
        accessible: false,
        loadTime,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Close the browser and cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get browser info
   */
  getBrowserInfo(): {
    type: string;
    version: string;
    isConnected: boolean;
  } {
    return {
      type: this.defaultOptions.browser,
      version: this.browserType.name(),
      isConnected: this.browser !== null && this.browser.isConnected(),
    };
  }
}
