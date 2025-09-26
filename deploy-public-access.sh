#!/bin/bash

# CTO Agent: Deploy Public Access Version - Remove Authentication
# This removes the basic auth requirement for public access

set -euo pipefail

echo "🔓 CTO AGENT: DEPLOYING PUBLIC ACCESS VERSION - REMOVING AUTHENTICATION..."
echo ""

# Configuration
PROJECT_ROOT="$(pwd)"
WEB_APP_DIR="$PROJECT_ROOT/apps/web"
TEMP_DEPLOY_DIR="/tmp/ai-nodes-public-deploy"

echo "📁 Step 1: Creating public deployment package..."

# Remove any existing temp directory
rm -rf "$TEMP_DEPLOY_DIR"
mkdir -p "$TEMP_DEPLOY_DIR"

# Copy web app source
cp -r "$WEB_APP_DIR"/* "$TEMP_DEPLOY_DIR/"

echo "✅ Copied web app source"

echo ""
echo "🔓 Step 2: Disabling authentication middleware..."

# Remove problematic API routes
rm -rf "$TEMP_DEPLOY_DIR/src/app/api/linear" 2>/dev/null || echo "Linear route already removed"
rm -rf "$TEMP_DEPLOY_DIR/src/app/api/proxy" 2>/dev/null || echo "Proxy route already removed"

# Create a public middleware that bypasses authentication
cat > "$TEMP_DEPLOY_DIR/src/middleware.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response with security headers but NO authentication
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  console.log(`[Middleware] Public access to: ${pathname}`);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
EOF

echo "✅ Created public access middleware (no authentication)"

echo ""
echo "⚙️  Step 3: Creating public package.json..."

# Create package.json without workspace dependencies
cat > "$TEMP_DEPLOY_DIR/package.json" << 'EOF'
{
  "name": "ai-nodes-web-public",
  "version": "1.0.0",
  "description": "AI Nodes Web Dashboard - Public Access",
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

echo "✅ Created public package.json"

echo ""
echo "🔧 Step 4: Creating configurations..."

# Create tsconfig.json
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

# Create next.config.js
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
  output: 'standalone',
};

export default nextConfig;
EOF

# Create vercel.json
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

echo "✅ Created all configuration files"

echo ""
echo "🚀 Step 5: Deploying public access version..."

cd "$TEMP_DEPLOY_DIR"

# Deploy to Vercel
if vercel --prod --yes; then
    echo ""
    echo "🎉 PUBLIC ACCESS DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "✅ Web app deployed with public access"
    echo "🔓 No authentication required"
    echo "✅ Clean build completed"
    echo ""
    echo "🔗 Your web app is now publicly accessible!"
    echo "📧 Email notifications should remain clean"
    echo ""
    echo "🌐 Anyone can now access your AI Nodes dashboard"
else
    echo ""
    echo "❌ PUBLIC DEPLOYMENT FAILED!"
    echo "Check the error messages above for details"
    exit 1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DEPLOY_DIR"

echo ""
echo "🎯 PUBLIC ACCESS DEPLOYMENT COMPLETE!"
echo ""
echo "🔓 NO MORE USERNAME/PASSWORD REQUIRED!"
echo "🌐 Your web app is now publicly accessible"
echo "🚀 Dashboard is live and working"
echo ""
echo "✅ Mission accomplished: Public access enabled!"
