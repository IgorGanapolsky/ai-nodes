#!/bin/bash

# Vercel Deployment Validation Script
# This script validates the project before deployment to prevent errors

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/deployment-validation-$(date +%Y%m%d-%H%M%S).log"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")  echo -e "${GREEN}[$timestamp][INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp][WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[$timestamp][ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[$timestamp][DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
}

# Validation functions
validate_vercel_config() {
    log "INFO" "Validating Vercel configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Check if vercel.json exists
    if [[ ! -f "vercel.json" ]]; then
        log "ERROR" "vercel.json not found"
        return 1
    fi
    
    # Validate JSON syntax
    if ! python3 -m json.tool vercel.json > /dev/null 2>&1; then
        log "ERROR" "vercel.json has invalid JSON syntax"
        return 1
    fi
    
    # Check required fields
    local required_fields=("buildCommand" "installCommand" "outputDirectory")
    for field in "${required_fields[@]}"; do
        if ! grep -q "\"$field\"" vercel.json; then
            log "ERROR" "Missing required field: $field in vercel.json"
            return 1
        fi
    done
    
    log "INFO" "Vercel configuration is valid"
    return 0
}

validate_typescript() {
    log "INFO" "Running TypeScript type checking..."
    
    cd "$PROJECT_ROOT/apps/web"
    
    if ! pnpm type-check; then
        log "ERROR" "TypeScript type checking failed"
        return 1
    fi
    
    log "INFO" "TypeScript type checking passed"
    return 0
}

validate_build() {
    log "INFO" "Running build validation..."
    
    cd "$PROJECT_ROOT/apps/web"
    
    # Clean any previous builds
    log "INFO" "Cleaning previous builds..."
    rm -rf .next || true
    
    # Run the build
    if ! pnpm build; then
        log "ERROR" "Build validation failed"
        return 1
    fi
    
    # Check if build output exists
    if [[ ! -d ".next" ]]; then
        log "ERROR" "Build output not found"
        return 1
    fi
    
    log "INFO" "Build validation passed"
    return 0
}

validate_dependencies() {
    log "INFO" "Validating dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json exists
    if [[ ! -f "package.json" ]]; then
        log "ERROR" "package.json not found"
        return 1
    fi
    
    # Check if pnpm-lock.yaml exists
    if [[ ! -f "pnpm-lock.yaml" ]]; then
        log "ERROR" "pnpm-lock.yaml not found - run 'pnpm install' first"
        return 1
    fi
    
    # Install dependencies with frozen lockfile
    log "INFO" "Installing dependencies with frozen lockfile..."
    if ! pnpm install --frozen-lockfile; then
        log "ERROR" "Failed to install dependencies"
        return 1
    fi
    
    log "INFO" "Dependencies validated successfully"
    return 0
}

validate_environment() {
    log "INFO" "Validating environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .env.example exists
    if [[ ! -f ".env.example" ]]; then
        log "WARN" ".env.example not found"
    fi
    
    # Validate required environment variables for production
    local required_vars=("NODE_ENV")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log "WARN" "Missing environment variables: ${missing_vars[*]}"
        log "WARN" "These may be required for production deployment"
    fi
    
    log "INFO" "Environment validation completed"
    return 0
}

validate_lint() {
    log "INFO" "Running lint validation..."
    
    cd "$PROJECT_ROOT/apps/web"
    
    if ! pnpm lint; then
        log "WARN" "Lint validation failed - continuing with warnings"
        return 0
    fi
    
    log "INFO" "Lint validation passed"
    return 0
}

# Main validation function
run_validation() {
    log "INFO" "Starting Vercel deployment validation..."
    
    local validation_failed=false
    
    # Run all validations
    validate_vercel_config || validation_failed=true
    validate_dependencies || validation_failed=true
    validate_typescript || validation_failed=true
    validate_build || validation_failed=true
    validate_environment || validation_failed=true
    validate_lint || true  # Lint failures are warnings, not errors
    
    if [[ "$validation_failed" == "true" ]]; then
        log "ERROR" "Validation failed! Please fix the issues before deploying to Vercel."
        log "ERROR" "Check the log file: $LOG_FILE"
        return 1
    fi
    
    log "INFO" "All validations passed! Ready for Vercel deployment."
    log "INFO" "Log file: $LOG_FILE"
    return 0
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_validation
fi