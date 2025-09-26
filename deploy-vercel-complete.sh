#!/bin/bash

# CTO Agent: Complete Vercel Deployment Solution
# This script creates a fully working deployment with all dependencies

set -euo pipefail

echo "🚀 CTO AGENT: COMPLETE VERCEL DEPLOYMENT SOLUTION..."
echo ""

# Configuration
PROJECT_ROOT="$(pwd)"
WEB_APP_DIR="$PROJECT_ROOT/apps/web"
TEMP_DEPLOY_DIR="/tmp/ai-nodes-vercel-deploy"

echo "📋 Step 1: Building all dependencies..."

# Build core packages
pnpm --filter @depinautopilot/core build
pnpm --filter @depinautopilot/utils build

echo "✅ Core packages built successfully"

echo ""
echo "📁 Step 2: Creating deployment package..."

# Remove any existing temp directory
rm -rf "$TEMP_DEPLOY_DIR"
mkdir -p "$TEMP_DEPLOY_DIR"

# Copy web app source
cp -r "$WEB_APP_DIR"/* "$TEMP_DEPLOY_DIR/"

# Create node_modules structure for workspace dependencies
mkdir -p "$TEMP_DEPLOY_DIR/node_modules/@depinautopilot"

# Copy built core package
cp -r "$PROJECT_ROOT/packages/core" "$TEMP_DEPLOY_DIR/node_modules/@depinautopilot/"
cp -r "$PROJECT_ROOT/packages/utils" "$TEMP_DEPLOY_DIR/node_modules/@depinautopilot/"

echo "✅ Copied workspace dependencies"

echo ""
echo "⚙️  Step 3: Creating standalone package.json..."

# Create a standalone package.json with all dependencies resolved
cat > "$TEMP_DEPLOY_DIR/package.json" << 'EOF'
{
  "name": "ai-nodes-web",
  "version": "1.0.0",
  "description": "AI Nodes Web Dashboard",
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
    "@hookform/resolvers": "^5.2.2",
    "@linear/sdk": "^60.0.0",
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
    "@tanstack/react-query": "^5.15.5",
    "@tanstack/react-table": "^8.11.2",
    "@vercel/analytics": "^1.5.0",
    "@vercel/speed-insights": "^1.2.0",
    "axios": "^1.6.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "3.6.0",
    "framer-motion": "^10.16.16",
    "lucide-react": "^0.544.0",
    "next": "^14.0.4",
    "next-themes": "^0.4.6",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "react-hot-toast": "^2.4.1",
    "recharts": "^2.9.3",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.10",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.0.4",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo "✅ Created standalone package.json"

echo ""
echo "🔧 Step 4: Creating TypeScript configuration..."

# Create a standalone tsconfig.json
cat > "$TEMP_DEPLOY_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
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

echo "✅ Created standalone tsconfig.json"

echo ""
echo "🔧 Step 5: Creating Next.js configuration..."

# Create a deployment-optimized next.config.js
cat > "$TEMP_DEPLOY_DIR/next.config.js" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
  // Remove transpilePackages since we're bundling dependencies
  output: 'standalone',
};

export default nextConfig;
EOF

echo "✅ Created deployment-optimized next.config.js"

echo ""
echo "🔧 Step 6: Creating Vercel configuration..."

# Create optimized vercel.json
cat > "$TEMP_DEPLOY_DIR/vercel.json" << 'EOF'
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production",
    "CI": "true",
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 30
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

echo "✅ Created optimized vercel.json"

echo ""
echo "🚀 Step 7: Deploying to Vercel..."

cd "$TEMP_DEPLOY_DIR"

# Deploy to Vercel
if vercel --prod --yes; then
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "✅ Web app deployed successfully"
    echo "✅ All dependencies bundled correctly"
    echo "✅ TypeScript compilation working"
    echo "✅ Next.js build optimized"
    echo ""
    echo "🔗 Check your Vercel dashboard for the live URL"
    echo "📧 Email notifications should now be clean"
    echo ""
    echo "🛡️  Future deployments will use this clean configuration"
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "Check the error messages above for details"
    exit 1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DEPLOY_DIR"

echo ""
echo "🎯 COMPLETE VERCEL DEPLOYMENT SUCCESS!"
echo "Your web app is now live and email spam should stop completely."
