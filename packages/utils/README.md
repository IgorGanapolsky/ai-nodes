# @depinautopilot/utils

Shared utilities and helper functions for DePIN Autopilot applications.

## Installation

```bash
npm install @depinautopilot/utils
```

## Usage

### Import Everything

```typescript
import * as utils from '@depinautopilot/utils';

// Or import specific modules
import {
  loadConfig,
  getLogger,
  formatCurrency,
  generateUuid,
  ValidationError
} from '@depinautopilot/utils';
```

### Configuration Management

```typescript
import { loadConfig, getConfigValue } from '@depinautopilot/utils';

// Load and validate configuration
const config = loadConfig();

// Get specific config values
const port = getConfigValue('PORT');
const databaseUrl = getConfigValue('DATABASE_URL');
```

### Logging

```typescript
import { getLogger, Logger } from '@depinautopilot/utils';

// Get default logger
const logger = getLogger();

// Create custom logger
const apiLogger = new Logger({ service: 'api', pretty: true });

// Log messages
logger.info('Application started', { port: 3000 });
logger.error('Database connection failed', error, { retries: 3 });

// Create child logger with context
const requestLogger = logger.child({ requestId: 'req_123' });
```

### Error Handling

```typescript
import {
  BadRequestError,
  ValidationError,
  createHttpError,
  handleAsyncError
} from '@depinautopilot/utils';

// Throw structured errors
throw new BadRequestError('Invalid input data', { field: 'email' });

// Create errors from status codes
const error = createHttpError(404, 'User not found');

// Wrap async functions with error handling
const safeAsyncFunction = handleAsyncError(async (userId) => {
  return await getUserById(userId);
});
```

### Validation

```typescript
import {
  isValidEmail,
  validateAndSanitizeEmail,
  createValidationMiddleware,
  paginationSchema
} from '@depinautopilot/utils';

// Validate common formats
const email = 'user@example.com';
if (isValidEmail(email)) {
  const cleanEmail = validateAndSanitizeEmail(email);
}

// Use with Express middleware
const validateBody = createValidationMiddleware(userSchema);
app.post('/users', validateBody, (req, res) => {
  // req.validatedBody contains validated data
});
```

### Formatting

```typescript
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  truncateString
} from '@depinautopilot/utils';

// Format values for display
const price = formatCurrency(123.45); // "$123.45"
const change = formatPercentage(0.15); // "15.00%"
const date = formatDate(new Date(), { relative: true }); // "2 minutes ago"
const address = truncateMiddle('0x1234567890abcdef', 6, 4); // "0x1234...cdef"
```

### Cryptographic Utilities

```typescript
import {
  generateUuid,
  generateId,
  generateUserId,
  hashPassword,
  verifyPassword
} from '@depinautopilot/utils';

// Generate IDs
const uuid = generateUuid(); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
const userId = generateUserId(); // "user_abc123def456"
const sessionId = generateSessionId(); // "sess_xyz789"

// Password hashing
const { hash, salt } = hashPassword('mypassword');
const isValid = verifyPassword('mypassword', hash, salt);
```

### Utility Functions

```typescript
import {
  sleep,
  debounce,
  retry,
  withTimeout,
  deepClone
} from '@depinautopilot/utils';

// Async utilities
await sleep(1000); // Wait 1 second

// Retry with exponential backoff
const result = await retry(
  () => fetchDataFromAPI(),
  3, // max retries
  1000 // base delay
);

// Add timeout to promises
const data = await withTimeout(
  longRunningOperation(),
  5000 // timeout in ms
);

// Debounce functions
const debouncedSave = debounce(saveData, 300);
```

## Constants

```typescript
import { COMMON_CONSTANTS } from '@depinautopilot/utils';

const { HTTP_STATUS, TIME, PAGINATION } = COMMON_CONSTANTS;

// Use in your code
res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid data' });
setTimeout(callback, TIME.MINUTE * 5); // 5 minutes
```

## Modules

### Configuration (`src/config.ts`)
- Environment variable validation with Zod
- Type-safe configuration loading
- Support for all common env vars (DATABASE_URL, JWT_SECRET, etc.)

### Logging (`src/logger.ts`)
- Pino-based structured logging
- Request/response logging middleware
- Child loggers with context
- Pretty printing for development

### Errors (`src/errors.ts`)
- Comprehensive error class hierarchy
- HTTP status code mapping
- Operational vs programming error distinction
- Safe error serialization (removes sensitive data)

### Validation (`src/validators.ts`)
- Common validation schemas (email, URL, UUID, etc.)
- Express middleware for request validation
- Business logic validators (wallet addresses, token symbols)
- Safe validation with proper error handling

### Formatters (`src/formatters.ts`)
- Currency and percentage formatting
- Date and duration formatting
- File size and large number formatting
- API response formatting
- Crypto-specific formatters

### Crypto (`src/crypto.ts`)
- Secure ID generation
- Password hashing with scrypt
- HMAC signing and verification
- Various ID generators (UUID, short IDs, time-based)
- Checksums and nonces

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run type checking
npm run type-check

# Run tests
npm test

# Watch mode for development
npm run dev
```

## License

MIT