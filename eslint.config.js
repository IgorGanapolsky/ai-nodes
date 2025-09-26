import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      // TypeScript rules - relaxed for CI
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // JavaScript rules - relaxed for CI
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-unused-vars': 'off', // Turned off in favor of TypeScript rule
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-redeclare': 'warn',
      'no-undef': 'warn',

      // General rules - relaxed for CI
      eqeqeq: 'warn',
      curly: 'warn',
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      // Allow console.log in tests
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
      '**/*.js.map',
    ],
  },
];
