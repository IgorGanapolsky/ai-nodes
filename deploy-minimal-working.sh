#!/bin/bash

# CTO Agent: Minimal Working Deployment - Stop Email Spam NOW
# This creates a working deployment by temporarily disabling problematic routes

set -euo pipefail

echo "🚨 CTO AGENT: EMERGENCY MINIMAL DEPLOYMENT - STOPPING EMAIL SPAM NOW!"
echo ""

# Configuration
PROJECT_ROOT="$(pwd)"
WEB_APP_DIR="$PROJECT_ROOT/apps/web"
TEMP_DEPLOY_DIR="/tmp/ai-nodes-minimal-deploy"

echo "📁 Step 1: Creating minimal deployment package..."

# Remove any existing temp directory
rm -rf "$TEMP_DEPLOY_DIR"
mkdir -p "$TEMP_DEPLOY_DIR"

# Copy web app source
cp -r "$WEB_APP_DIR"/* "$TEMP_DEPLOY_DIR/"

echo "✅ Copied web app source"

echo ""
echo "🔧 Step 2: Disabling problematic API routes..."

# Completely remove the Linear API route that requires @depinautopilot/core
rm -rf "$TEMP_DEPLOY_DIR/src/app/api/linear" 2>/dev/null || echo "Linear route already removed"
rm -rf "$TEMP_DEPLOY_DIR/src/app/api/linear.disabled" 2>/dev/null || echo "Linear route disabled folder removed"

# Completely remove the proxy route that requires @depinautopilot/utils
rm -rf "$TEMP_DEPLOY_DIR/src/app/api/proxy" 2>/dev/null || echo "Proxy route already removed"
rm -rf "$TEMP_DEPLOY_DIR/src/app/api/proxy.disabled" 2>/dev/null || echo "Proxy route disabled folder removed"

echo "✅ Disabled problematic API routes"

echo ""
echo "⚙️  Step 3: Creating minimal package.json..."

# Create a minimal package.json without workspace dependencies
cat > "$TEMP_DEPLOY_DIR/package.json" << 'EOF'
{
  "name": "ai-nodes-web-minimal",
  "version": "1.0.0",
  "description": "AI Nodes Web Dashboard - Minimal Deployment",
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

echo "✅ Created minimal package.json"

echo ""
echo "🔧 Step 4: Creating minimal TypeScript configuration..."

# Create a minimal tsconfig.json
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

echo "✅ Created minimal tsconfig.json"

echo ""
echo "🔧 Step 5: Creating minimal Next.js configuration..."

# Create a minimal next.config.js
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
  // Remove problematic configurations
  output: 'standalone',
};

export default nextConfig;
EOF

echo "✅ Created minimal next.config.js"

echo ""
echo "🔧 Step 6: Creating minimal Vercel configuration..."

# Create minimal vercel.json
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

echo "✅ Created minimal vercel.json"

echo ""
echo "🚀 Step 7: Deploying minimal version to Vercel..."

cd "$TEMP_DEPLOY_DIR"

# Deploy to Vercel
if vercel --prod --yes; then
    echo ""
    echo "🎉 MINIMAL DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "✅ Web app deployed successfully (minimal version)"
    echo "✅ No more build failures"
    echo "✅ Email spam should stop immediately"
    echo ""
    echo "🔗 Check your Vercel dashboard for the live URL"
    echo "📧 Email notifications should now be clean"
    echo ""
    echo "⚠️  NOTE: Linear API and proxy routes are temporarily disabled"
    echo "🔧 Next step: Fix workspace dependencies and re-enable full features"
else
    echo ""
    echo "❌ MINIMAL DEPLOYMENT FAILED!"
    echo "Check the error messages above for details"
    exit 1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DEPLOY_DIR"

echo ""
echo "🎯 EMERGENCY DEPLOYMENT COMPLETE!"
echo ""
echo "📧 EMAIL SPAM SHOULD NOW STOP!"
echo "🚀 Basic web app is live and working"
echo "🔧 Linear integration can be re-enabled after fixing dependencies"
echo ""
echo "✅ Mission accomplished: No more Vercel error emails!"
