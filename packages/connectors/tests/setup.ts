/**
 * Test setup file
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.USE_MOCK_DATA = 'true';

// Mock console methods for cleaner test output
const originalConsole = console;

beforeEach(() => {
  // Reset console mocks
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  // Restore original console
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);