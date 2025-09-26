# Development Tooling Setup

This document outlines the modern development tooling configuration implemented for this TypeScript monorepo.

## 🔧 Tooling Overview

### Core Tools Configured:

- **ESLint**: Comprehensive linting for TypeScript, JavaScript, and React
- **Prettier**: Code formatting
- **Trunk.io**: Multi-tool linter and formatter orchestration
- **Husky**: Git hooks management
- **lint-staged**: Run linters on staged files only
- **commitlint**: Conventional commit message validation

## 📁 Configuration Files

### Root Level Configurations

#### `.eslintrc.json`

- Comprehensive ESLint rules for TypeScript and JavaScript
- Special configurations for React (web/mobile apps)
- Test-specific overrides for Jest/Vitest
- Security and performance-focused rules

#### `.prettierrc.json`

- Consistent code formatting rules
- Semi-colons, single quotes, trailing commas
- 100 character line width

#### `.trunk/trunk.yaml`

- Modern multi-tool configuration
- Security scanning (OSV, Trufflehog, Semgrep)
- Code quality tools (Biome, ESLint, Prettier)
- Infrastructure linting (Hadolint, Yamllint)
- Performance optimization tools

#### `lint-staged.config.mjs`

- TypeScript type checking on staged files
- ESLint with automatic fixes
- Prettier formatting
- Test execution for changed files
- Package.json validation and sorting
- Markdown and YAML linting

## 🎣 Git Hooks

### Pre-commit (`.husky/pre-commit`)

- Validates git repository state
- Lists staged files for transparency
- Runs Trunk checks (if available)
- Executes lint-staged pipeline
- Comprehensive error reporting with helpful tips

### Commit Message (`.husky/commit-msg`)

- Validates conventional commit format
- Provides helpful examples on failure
- Gracefully handles missing commitlint

### Pre-push (`.husky/pre-push`)

- Detects pushes to protected branches (main/master)
- Runs comprehensive validation suite:
  - TypeScript type checking
  - Full test suite
  - Complete linting
  - Production build verification
- Security and quality checks with Trunk

## 🚀 Quick Start

### Setup Development Environment

```bash
# Run the automated setup script
./scripts/setup-dev.sh
```

### Manual Setup

```bash
# Install dependencies
pnpm install

# Setup git hooks
pnpm exec husky install

# Initial formatting and linting
pnpm format
pnpm lint
```

## 📝 Available Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Start development servers      |
| `pnpm build`        | Build all packages             |
| `pnpm test`         | Run test suites                |
| `pnpm lint`         | Run ESLint across all packages |
| `pnpm format`       | Format code with Prettier      |
| `pnpm format:check` | Check code formatting          |
| `pnpm type-check`   | Run TypeScript type checking   |

## 🔍 Quality Gates

### Pre-commit Validation

- ✅ TypeScript compilation (no emit)
- ✅ ESLint with auto-fix
- ✅ Prettier formatting
- ✅ Test execution for changed files
- ✅ Security scanning

### Pre-push Validation (Protected Branches)

- ✅ Full TypeScript type checking
- ✅ Complete test suite
- ✅ Comprehensive linting
- ✅ Production build verification
- ✅ Security and quality analysis

## 🏗️ Monorepo Structure Support

### Package-Specific Configurations

- **Web App**: Next.js + React rules
- **Mobile App**: React Native rules
- **Server**: Node.js backend rules
- **Packages**: Library-specific linting

### Workspace Integration

- Turbo.js for build orchestration
- PNPM workspace dependencies
- Shared tooling configurations
- Cross-package type checking

## 🛡️ Security Features

### Integrated Security Scanning

- **OSV Scanner**: Vulnerability detection
- **Trufflehog**: Secret scanning
- **Semgrep**: Static analysis security testing
- **Pre-commit validation**: Prevents insecure commits

### Dependency Management

- Lock file validation
- Package.json structure checking
- Dependency conflict detection

## 🎯 Performance Optimization

### Fast Development Workflow

- **Incremental checking**: Only lint/test changed files
- **Parallel execution**: Multi-tool coordination
- **Smart caching**: Trunk and Turbo caching
- **Selective validation**: Context-aware git hooks

### Build Optimization

- **Bundle analysis**: Performance monitoring
- **Image optimization**: Automated with oxipng
- **Code splitting**: Build-time verification

## 🐛 Troubleshooting

### Common Issues

#### ESLint Errors

```bash
# Auto-fix most issues
pnpm lint --fix

# Check specific files
npx eslint path/to/file.ts
```

#### Formatting Issues

```bash
# Format all files
pnpm format

# Check what needs formatting
pnpm format:check
```

#### Git Hook Failures

```bash
# Skip hooks (emergency only)
git commit --no-verify

# Fix permissions
chmod +x .husky/*
```

#### Type Checking Errors

```bash
# Check types across workspace
pnpm type-check

# Check specific package
cd packages/core && npx tsc --noEmit
```

### Getting Help

1. **Check hook output**: Git hooks provide detailed error messages
2. **Run individual tools**: Test ESLint, Prettier, TypeScript separately
3. **Review configurations**: Check `.eslintrc.json`, `.prettierrc.json`
4. **Verify dependencies**: Ensure all dev dependencies are installed

## 🔮 Future Enhancements

### Planned Additions

- [ ] Visual regression testing integration
- [ ] Bundle size monitoring
- [ ] Performance budgets
- [ ] Automated dependency updates
- [ ] Enhanced security policies

### Trunk.io Benefits

- Automatic tool updates
- New linter discovery
- Performance monitoring
- Team synchronization
- Cloud-based reporting

---

_This development setup ensures code quality, security, and performance while maintaining developer productivity in a modern TypeScript monorepo environment._
