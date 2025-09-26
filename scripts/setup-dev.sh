#!/bin/bash

set -e

echo "🚀 Setting up development environment for TypeScript monorepo..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_status "Checking prerequisites..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2)
REQUIRED_NODE="20.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE" ]; then
    print_error "Node.js version $REQUIRED_NODE or higher is required. Found: $NODE_VERSION"
    exit 1
fi
print_success "Node.js version: $NODE_VERSION"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is required but not installed. Install it with: npm install -g pnpm"
    exit 1
fi
print_success "pnpm is installed: $(pnpm --version)"

# Install dependencies
print_status "Installing dependencies..."
if ! pnpm install; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Setup git hooks
print_status "Setting up git hooks with husky..."
if ! pnpm exec husky install; then
    print_warning "Failed to setup husky git hooks"
else
    print_success "Git hooks configured"
fi

# Make hooks executable
chmod +x .husky/* 2>/dev/null || true

# Install trunk if not available
print_status "Checking Trunk.io CLI..."
if ! command -v trunk &> /dev/null; then
    print_warning "Trunk CLI not found globally. You can install it from https://trunk.io"
    print_status "Trunk tools are configured locally in .trunk/"
else
    print_success "Trunk CLI is available: $(trunk --version)"
fi

# Run initial linting and formatting
print_status "Running initial code quality checks..."

# Format code
print_status "Formatting code with Prettier..."
if pnpm format; then
    print_success "Code formatted"
else
    print_warning "Some formatting issues found - check the output above"
fi

# Run linting
print_status "Running ESLint..."
if pnpm lint; then
    print_success "Linting passed"
else
    print_warning "Some linting issues found - check the output above"
fi

# Run type checking
print_status "Running TypeScript type checking..."
if pnpm type-check; then
    print_success "Type checking passed"
else
    print_warning "Type checking found issues - check the output above"
fi

print_success "Development environment setup complete!"
echo ""
echo "📋 Available commands:"
echo "  pnpm dev        - Start development servers"
echo "  pnpm build      - Build all packages"
echo "  pnpm test       - Run tests"
echo "  pnpm lint       - Run ESLint"
echo "  pnpm format     - Format code with Prettier"
echo "  pnpm type-check - Run TypeScript type checking"
echo ""
echo "🔧 Git hooks configured:"
echo "  pre-commit  - Runs linting, formatting, and type checking"
echo "  commit-msg  - Validates commit message format"
echo "  pre-push    - Runs comprehensive checks before push"
echo ""
echo "🎉 Happy coding!"