#!/bin/bash
# Vercel Deployment Script for Monorepo Web App
# This script handles the complexities of deploying a Next.js app from a monorepo

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_APP_DIR="$PROJECT_ROOT/apps/web"
TEMP_DEPLOY_DIR="/tmp/depinautopilot-web-deploy"

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case "$level" in
        "INFO")  echo -e "${GREEN}[$timestamp][INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp][WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[$timestamp][ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${BLUE}[$timestamp][DEBUG]${NC} $message" ;;
    esac
}

# Cleanup function
cleanup() {
    if [[ -d "$TEMP_DEPLOY_DIR" ]]; then
        log "INFO" "Cleaning up temporary deployment directory..."
        rm -rf "$TEMP_DEPLOY_DIR"
    fi
}

# Set up cleanup trap
trap cleanup EXIT

prepare_deployment() {
    log "INFO" "Preparing deployment package..."
    
    # Create temporary deployment directory
    rm -rf "$TEMP_DEPLOY_DIR"
    mkdir -p "$TEMP_DEPLOY_DIR"
    
    # Copy web app files
    log "INFO" "Copying web app files..."
    cp -r "$WEB_APP_DIR"/* "$TEMP_DEPLOY_DIR/"

    # Copy essential config files (except tsconfig.json which we'll create standalone)
    log "INFO" "Copying configuration files..."
    if [[ -f "$WEB_APP_DIR/next.config.js" ]]; then
        cp "$WEB_APP_DIR/next.config.js" "$TEMP_DEPLOY_DIR/"
    fi
    if [[ -f "$WEB_APP_DIR/tailwind.config.js" ]]; then
        cp "$WEB_APP_DIR/tailwind.config.js" "$TEMP_DEPLOY_DIR/"
    fi
    if [[ -f "$WEB_APP_DIR/postcss.config.js" ]]; then
        cp "$WEB_APP_DIR/postcss.config.js" "$TEMP_DEPLOY_DIR/"
    fi
    
    # Copy workspace dependencies
    log "INFO" "Copying workspace dependencies..."
    mkdir -p "$TEMP_DEPLOY_DIR/packages"
    
    # Copy core package
    if [[ -d "$PROJECT_ROOT/packages/core" ]]; then
        cp -r "$PROJECT_ROOT/packages/core" "$TEMP_DEPLOY_DIR/packages/"
    fi
    
    # Copy utils package
    if [[ -d "$PROJECT_ROOT/packages/utils" ]]; then
        cp -r "$PROJECT_ROOT/packages/utils" "$TEMP_DEPLOY_DIR/packages/"
    fi
    
    # Create a standalone package.json for deployment
    log "INFO" "Creating standalone package.json..."
    
    # Read the web app's package.json and modify it
    cat > "$TEMP_DEPLOY_DIR/package.json" << 'EOF'
{
  "name": "depinautopilot-web",
  "version": "1.0.0",
  "description": "DePIN Autopilot Web Dashboard",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.15.5",
    "@tanstack/react-table": "^8.11.2",
    "recharts": "^2.9.3",
    "lucide-react": "^0.303.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "@hookform/resolvers": "^5.2.2",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "date-fns": "3.6.0",
    "react-hot-toast": "^2.4.1",
    "framer-motion": "^10.16.16",
    "axios": "^1.6.2",
    "next-themes": "^0.4.6",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.5.6"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4",
    "@tailwindcss/typography": "^0.5.10"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
    
    # Create a simple vercel.json for the deployment
    cat > "$TEMP_DEPLOY_DIR/vercel.json" << 'EOF'
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production",
    "CI": "true"
  },
  "build": {
    "env": {
      "NODE_ENV": "production",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF

    # Create a standalone tsconfig.json
    cat > "$TEMP_DEPLOY_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out"]
}
EOF

    log "INFO" "Deployment package prepared in $TEMP_DEPLOY_DIR"
}

build_locally() {
    log "INFO" "Building the application locally first..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log "INFO" "Installing dependencies..."
    pnpm install --frozen-lockfile --ignore-scripts
    
    # Build the web app
    log "INFO" "Building web app..."
    pnpm --filter @depinautopilot/web build
    
    # Copy the built files to deployment directory
    if [[ -d "$WEB_APP_DIR/.next" ]]; then
        log "INFO" "Copying built files..."
        cp -r "$WEB_APP_DIR/.next" "$TEMP_DEPLOY_DIR/"
    fi
    
    log "INFO" "Local build completed successfully"
}

deploy_to_vercel() {
    log "INFO" "Deploying to Vercel..."
    
    cd "$TEMP_DEPLOY_DIR"
    
    # Deploy to Vercel
    if vercel --prod --yes; then
        log "INFO" "Deployment successful!"
        return 0
    else
        log "ERROR" "Deployment failed!"
        return 1
    fi
}

# Main execution
main() {
    log "INFO" "Starting Vercel deployment process..."
    
    # Validate environment
    if ! command -v vercel >/dev/null 2>&1; then
        log "ERROR" "Vercel CLI is not installed"
        exit 1
    fi
    
    if ! command -v pnpm >/dev/null 2>&1; then
        log "ERROR" "PNPM is not installed"
        exit 1
    fi
    
    # Execute deployment steps
    prepare_deployment
    build_locally
    deploy_to_vercel
    
    log "INFO" "Deployment process completed!"
}

# Run the script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
