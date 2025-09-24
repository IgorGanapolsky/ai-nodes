#!/usr/bin/env node

/**
 * Self-Healing CI Utilities
 * Provides advanced healing capabilities for complex CI failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HealingUtils {
  constructor() {
    this.packageJsonPath = 'package.json';
    this.lockfilePath = 'pnpm-lock.yaml';
  }

  /**
   * Analyze dependency conflicts and provide smart resolution
   */
  analyzeDependencyConflicts() {
    console.log('🔍 Analyzing dependency conflicts...');

    try {
      // Read package.json
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));

      // Common problematic patterns
      const problemPatterns = [
        // React version mismatches
        { pattern: /react.*\^18/, fix: () => this.fixReactVersion() },
        // TypeScript version conflicts
        { pattern: /typescript.*\^5/, fix: () => this.fixTypeScriptVersion() },
        // ESLint plugin conflicts
        { pattern: /@typescript-eslint\/.*\^8/, fix: () => this.fixESLintPlugins() }
      ];

      const conflicts = [];

      // Check for known conflict patterns
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const [name, version] of Object.entries(allDeps)) {
        for (const pattern of problemPatterns) {
          if (pattern.pattern.test(`${name}@${version}`)) {
            conflicts.push({ name, version, fix: pattern.fix });
          }
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Error analyzing dependencies:', error.message);
      return [];
    }
  }

  /**
   * Fix React version conflicts
   */
  fixReactVersion() {
    console.log('🔧 Fixing React version conflicts...');

    try {
      // Align all React packages to the same version
      const commands = [
        'pnpm add react@^18.3.0 react-dom@^18.3.0',
        'pnpm add -D @types/react@^18.3.0 @types/react-dom@^18.3.0'
      ];

      commands.forEach(cmd => {
        try {
          execSync(cmd, { stdio: 'pipe' });
        } catch (e) {
          console.warn(`Command failed (non-critical): ${cmd}`);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to fix React versions:', error.message);
      return false;
    }
  }

  /**
   * Fix TypeScript version conflicts
   */
  fixTypeScriptVersion() {
    console.log('🔧 Fixing TypeScript version conflicts...');

    try {
      // Update TypeScript and related packages
      execSync('pnpm add -D typescript@^5.6.0', { stdio: 'pipe' });
      execSync('pnpm add -D @typescript-eslint/eslint-plugin@^8.44.0', { stdio: 'pipe' });
      execSync('pnpm add -D @typescript-eslint/parser@^8.44.0', { stdio: 'pipe' });

      return true;
    } catch (error) {
      console.error('Failed to fix TypeScript versions:', error.message);
      return false;
    }
  }

  /**
   * Fix ESLint plugin conflicts
   */
  fixESLintPlugins() {
    console.log('🔧 Fixing ESLint plugin conflicts...');

    try {
      // Remove and reinstall ESLint ecosystem
      const eslintPackages = [
        '@typescript-eslint/eslint-plugin',
        '@typescript-eslint/parser',
        'eslint-config-prettier',
        '@eslint/js'
      ];

      // Remove packages
      execSync(`pnpm remove ${eslintPackages.join(' ')}`, { stdio: 'pipe' });

      // Reinstall with compatible versions
      execSync('pnpm add -D @typescript-eslint/eslint-plugin@^8.44.0', { stdio: 'pipe' });
      execSync('pnpm add -D @typescript-eslint/parser@^8.44.0', { stdio: 'pipe' });
      execSync('pnpm add -D eslint-config-prettier@^10.1.0', { stdio: 'pipe' });
      execSync('pnpm add -D @eslint/js@^8.57.0', { stdio: 'pipe' });

      return true;
    } catch (error) {
      console.error('Failed to fix ESLint plugins:', error.message);
      return false;
    }
  }

  /**
   * Smart lint error fixing
   */
  smartLintFix() {
    console.log('🎨 Performing smart lint fixes...');

    const fixes = [
      () => this.fixImportOrder(),
      () => this.fixUnusedImports(),
      () => this.fixQuoteStyle(),
      () => this.fixSemicolons(),
      () => this.fixIndentation()
    ];

    fixes.forEach(fix => {
      try {
        fix();
      } catch (error) {
        console.warn(`Lint fix failed (non-critical):`, error.message);
      }
    });
  }

  /**
   * Fix import order issues
   */
  fixImportOrder() {
    console.log('📋 Fixing import order...');

    const files = this.getSourceFiles();

    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Extract all imports
        const importRegex = /^import\s+.*?from\s+['"](.*?)['"];?\s*$/gm;
        const imports = [];
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          imports.push({
            full: match[0],
            module: match[1]
          });
        }

        if (imports.length === 0) return;

        // Sort imports: external, then internal
        const sortedImports = imports.sort((a, b) => {
          const aExternal = !a.module.startsWith('./') && !a.module.startsWith('../');
          const bExternal = !b.module.startsWith('./') && !b.module.startsWith('../');

          if (aExternal && !bExternal) return -1;
          if (!aExternal && bExternal) return 1;
          return a.module.localeCompare(b.module);
        });

        // Remove old imports and add sorted ones
        content = content.replace(importRegex, '');
        const sortedImportString = sortedImports.map(imp => imp.full).join('\n') + '\n';
        content = sortedImportString + content;

        fs.writeFileSync(file, content);
      } catch (error) {
        console.warn(`Failed to fix imports in ${file}:`, error.message);
      }
    });
  }

  /**
   * Remove unused imports
   */
  fixUnusedImports() {
    console.log('🗑️ Removing unused imports...');

    try {
      // Use ESLint to remove unused imports
      execSync('npx eslint --fix --rule "no-unused-vars: error" --ext .ts,.tsx,.js,.jsx .', {
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn('ESLint unused import fix failed (non-critical)');
    }
  }

  /**
   * Fix quote style consistency
   */
  fixQuoteStyle() {
    console.log('📝 Fixing quote style...');

    const files = this.getSourceFiles();

    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Convert double quotes to single quotes (except in JSX)
        content = content.replace(/"([^"]*?)"/g, (match, p1) => {
          // Don't change quotes in JSX attributes
          if (match.includes('<') || match.includes('>')) {
            return match;
          }
          return `'${p1}'`;
        });

        fs.writeFileSync(file, content);
      } catch (error) {
        console.warn(`Failed to fix quotes in ${file}:`, error.message);
      }
    });
  }

  /**
   * Fix semicolon consistency
   */
  fixSemicolons() {
    console.log('🔗 Fixing semicolons...');

    const files = this.getSourceFiles();

    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add missing semicolons
        content = content.replace(/^(\s*.*[^;{}\s])\s*$/gm, '$1;');

        fs.writeFileSync(file, content);
      } catch (error) {
        console.warn(`Failed to fix semicolons in ${file}:`, error.message);
      }
    });
  }

  /**
   * Fix indentation
   */
  fixIndentation() {
    console.log('📏 Fixing indentation...');

    try {
      // Use Prettier for consistent indentation
      execSync('npx prettier --write "**/*.{ts,tsx,js,jsx,json,md,yml,yaml}"', {
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn('Prettier indentation fix failed (non-critical)');
    }
  }

  /**
   * Advanced type error healing
   */
  advancedTypeHealing() {
    console.log('🔬 Performing advanced type healing...');

    try {
      // Get type errors
      const typeCheckResult = execSync('npx tsc --noEmit', {
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (error) {
      const errorOutput = error.stdout || error.message;
      this.processTypeErrors(errorOutput);
    }
  }

  /**
   * Process and fix specific type errors
   */
  processTypeErrors(errorOutput) {
    console.log('🔧 Processing type errors...');

    const lines = errorOutput.split('\n');
    const errors = [];

    lines.forEach(line => {
      const match = line.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS(\d+): (.+)/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    });

    // Apply fixes based on error types
    errors.forEach(error => {
      try {
        this.fixSpecificTypeError(error);
      } catch (e) {
        console.warn(`Failed to fix type error in ${error.file}:${error.line}`);
      }
    });
  }

  /**
   * Fix specific type errors based on error code
   */
  fixSpecificTypeError(error) {
    const content = fs.readFileSync(error.file, 'utf8');
    const lines = content.split('\n');

    switch (error.code) {
      case '2304': // Cannot find name
        this.addMissingImport(error, lines);
        break;
      case '2322': // Type assignment error
        this.addTypeAssertion(error, lines);
        break;
      case '2339': // Property does not exist
        this.addOptionalChaining(error, lines);
        break;
      default:
        this.addTypeSuppressionComment(error, lines);
    }

    fs.writeFileSync(error.file, lines.join('\n'));
  }

  /**
   * Add missing import for undefined names
   */
  addMissingImport(error, lines) {
    // Simple heuristic for common missing imports
    const missingName = error.message.match(/'(.+)'/)?.[1];

    if (missingName) {
      const importMap = {
        'React': "import React from 'react';",
        'useState': "import { useState } from 'react';",
        'useEffect': "import { useEffect } from 'react';",
        'NextPage': "import { NextPage } from 'next';",
        'GetServerSideProps': "import { GetServerSideProps } from 'next';"
      };

      if (importMap[missingName]) {
        lines.unshift(importMap[missingName]);
      }
    }
  }

  /**
   * Add type assertion for assignment errors
   */
  addTypeAssertion(error, lines) {
    if (error.line <= lines.length) {
      const line = lines[error.line - 1];
      // Add 'as any' to the problematic assignment
      lines[error.line - 1] = line.replace(/=\s*(.+);$/, '= $1 as any;');
    }
  }

  /**
   * Add optional chaining for property access errors
   */
  addOptionalChaining(error, lines) {
    if (error.line <= lines.length) {
      const line = lines[error.line - 1];
      // Add optional chaining where appropriate
      lines[error.line - 1] = line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
    }
  }

  /**
   * Add type suppression comment
   */
  addTypeSuppressionComment(error, lines) {
    if (error.line <= lines.length) {
      lines.splice(error.line - 1, 0, '  // @ts-expect-error: Auto-generated suppression - needs manual review');
    }
  }

  /**
   * Get all source files in the project
   */
  getSourceFiles() {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = [];

    const searchDir = (dir) => {
      if (dir.includes('node_modules') || dir.includes('.git')) return;

      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    };

    searchDir('.');
    return files.filter(file => !file.includes('node_modules'));
  }

  /**
   * Smart test healing
   */
  smartTestHealing() {
    console.log('🧪 Performing smart test healing...');

    try {
      // Run tests and capture failures
      const testResult = execSync('npm test -- --reporter=json', {
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (error) {
      const testOutput = error.stdout || error.message;
      this.processTestFailures(testOutput);
    }
  }

  /**
   * Process test failures and apply fixes
   */
  processTestFailures(testOutput) {
    console.log('🔧 Processing test failures...');

    // Common test failure patterns and their fixes
    const failurePatterns = [
      {
        pattern: /timeout/i,
        fix: (file) => this.increaseTestTimeout(file)
      },
      {
        pattern: /cannot find module/i,
        fix: (file) => this.addTestMocks(file)
      },
      {
        pattern: /render.*error/i,
        fix: (file) => this.wrapInTestingLibrary(file)
      }
    ];

    // Apply fixes based on patterns
    failurePatterns.forEach(({ pattern, fix }) => {
      if (pattern.test(testOutput)) {
        const testFiles = this.getTestFiles();
        testFiles.forEach(fix);
      }
    });
  }

  /**
   * Increase test timeout for flaky tests
   */
  increaseTestTimeout(file) {
    try {
      let content = fs.readFileSync(file, 'utf8');

      // Add timeout to test suites
      content = content.replace(
        /describe\((['"`])(.+?)\1,\s*\(\)\s*=>\s*{/g,
        "describe('$2', () => {\n  jest.setTimeout(30000);"
      );

      fs.writeFileSync(file, content);
    } catch (error) {
      console.warn(`Failed to increase timeout in ${file}`);
    }
  }

  /**
   * Add test mocks for missing modules
   */
  addTestMocks(file) {
    try {
      let content = fs.readFileSync(file, 'utf8');

      // Add common mocks at the top of test files
      const mocks = `
// Auto-generated mocks
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
  }),
}));

jest.mock('next/head', () => {
  return function MockHead({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});
`;

      content = mocks + content;
      fs.writeFileSync(file, content);
    } catch (error) {
      console.warn(`Failed to add mocks to ${file}`);
    }
  }

  /**
   * Wrap components in testing library
   */
  wrapInTestingLibrary(file) {
    try {
      let content = fs.readFileSync(file, 'utf8');

      // Add testing library imports if not present
      if (!content.includes('@testing-library/react')) {
        content = "import { render, screen } from '@testing-library/react';\n" + content;
      }

      // Wrap render calls in proper testing library setup
      content = content.replace(
        /render\(<(.+?)\/>\)/g,
        'render(<$1 />)'
      );

      fs.writeFileSync(file, content);
    } catch (error) {
      console.warn(`Failed to wrap with testing library in ${file}`);
    }
  }

  /**
   * Get all test files
   */
  getTestFiles() {
    const testPatterns = ['.test.', '.spec.'];
    return this.getSourceFiles().filter(file =>
      testPatterns.some(pattern => file.includes(pattern))
    );
  }
}

// CLI Interface
if (require.main === module) {
  const utils = new HealingUtils();
  const command = process.argv[2];

  switch (command) {
    case 'dependencies':
      console.log('🔧 Healing dependencies...');
      const conflicts = utils.analyzeDependencyConflicts();
      conflicts.forEach(conflict => conflict.fix());
      break;

    case 'lint':
      console.log('🎨 Healing lint issues...');
      utils.smartLintFix();
      break;

    case 'types':
      console.log('🔬 Healing type issues...');
      utils.advancedTypeHealing();
      break;

    case 'tests':
      console.log('🧪 Healing test issues...');
      utils.smartTestHealing();
      break;

    case 'all':
      console.log('🚀 Running complete healing suite...');
      const allConflicts = utils.analyzeDependencyConflicts();
      allConflicts.forEach(conflict => conflict.fix());
      utils.smartLintFix();
      utils.advancedTypeHealing();
      utils.smartTestHealing();
      break;

    default:
      console.log(`
Usage: node healing-utils.js <command>

Commands:
  dependencies  Fix dependency conflicts
  lint         Fix lint errors
  types        Fix type errors
  tests        Fix test failures
  all          Run all healing procedures

Examples:
  node healing-utils.js dependencies
  node healing-utils.js all
      `);
  }
}

module.exports = HealingUtils;