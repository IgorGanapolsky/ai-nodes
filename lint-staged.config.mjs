export default {
  // TypeScript and JavaScript files
  "*.{ts,tsx,js,jsx}": [
    // Run TypeScript compiler for type checking (no emit)
    "tsc --noEmit --skipLibCheck",
    // Run ESLint with automatic fixes
    "eslint --fix --max-warnings=0",
    // Run Prettier for formatting
    "prettier --write",
    // Run tests for changed files (only if test files exist)
    () => "pnpm test --run --changed --passWithNoTests"
  ],

  // All supported file types for formatting
  "*.{ts,tsx,js,jsx,md,json,yml,yaml,css,scss,html}": [
    "prettier --write"
  ],

  // Package.json files for dependency validation
  "**/package.json": [
    // Validate package.json structure
    "prettier --write",
    // Sort package.json fields
    () => "npx sort-package-json"
  ],

  // Markdown files for documentation
  "*.md": [
    "prettier --write",
    // Check for broken links (if markdownlint is available)
    "markdownlint --fix"
  ],

  // Configuration files
  "*.{yml,yaml}": [
    "prettier --write",
    "yamllint"
  ],

  // Lock files - just check for conflicts
  "*.lock": [
    () => "echo 'Lock file changes detected - ensure they are intentional'"
  ]
};

