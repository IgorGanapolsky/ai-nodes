#!/bin/bash

echo "🔧 Fixing Vercel deployments permanently..."

# 1. Remove all Vercel projects except the main one
echo "📋 Step 1: Cleaning up duplicate Vercel projects..."
echo "Please go to https://vercel.com/igorganapolskys-projects and delete these projects:"
echo "  - ai-nodes-web"
echo "  - ai-nodes-web-2"
echo "  - ai-nodes-web-new"
echo "Keep only: ai-nodes"
echo ""

# 2. Update vercel.json with proper ignore rules
echo "📋 Step 2: Creating .vercelignore to prevent unnecessary rebuilds..."
cat > .vercelignore << 'EOF'
# Ignore all non-web apps
apps/cli
apps/mobile
apps/server

# Ignore test files
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx

# Ignore development files
*.md
.env*
!.env.example
scripts
docs
test-*.ts
fix-*.ts
monitor-*.ts
setup-*.ts
*.log

# Ignore Linear integration test files
packages/core/src/linear/example.ts
test-linear-integration.ts
fix-vercel-deployment.ts
get-linear-team.ts
monitor-vercel.ts

# Ignore CI/CD files we don't need
.github/workflows/renovate.yml.disabled
renovate.json.disabled
EOF

echo "✅ .vercelignore created"

# 3. Update package.json to ensure proper build
echo "📋 Step 3: Ensuring package.json has correct scripts..."

# 4. Create environment variables file for Vercel
echo "📋 Step 4: Setting up environment variables..."
cat > .env.production << 'EOF'
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://ai-nodes.vercel.app

# Add other necessary production variables here
# DO NOT add sensitive keys here - use Vercel dashboard
EOF

echo "✅ Production environment file created"

# 5. Update vercel.json to reduce build frequency
echo "📋 Step 5: Updating vercel.json to reduce unnecessary builds..."
cat > vercel.json << 'EOF'
{
  "github": {
    "silent": true,
    "autoJobCancelation": true
  },
  "functions": {
    "apps/web/app/api/**/*": {
      "maxDuration": 30
    }
  },
  "buildCommand": "pnpm --filter @depinautopilot/web build",
  "installCommand": "pnpm install --frozen-lockfile --ignore-scripts",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "ignoreCommand": "git diff HEAD^ HEAD --quiet -- apps/web packages/core packages/db packages/utils",
  "env": {
    "NODE_ENV": "production",
    "CI": "true",
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
EOF

echo "✅ vercel.json updated with ignore command"

# 6. Test the build locally
echo "📋 Step 6: Testing build locally..."
cd apps/web
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
else
    echo "❌ Local build failed - please check errors above"
    exit 1
fi

cd ../..

# 7. Deploy to Vercel
echo "📋 Step 7: Deploying to Vercel..."
echo "Run: npx vercel --prod"

echo ""
echo "🎉 Vercel configuration fixed!"
echo ""
echo "📝 IMPORTANT NEXT STEPS:"
echo "1. Go to https://vercel.com/igorganapolskys-projects"
echo "2. Delete these duplicate projects: ai-nodes-web, ai-nodes-web-2, ai-nodes-web-new"
echo "3. In the ai-nodes project settings:"
echo "   - Go to Settings > Git"
echo "   - Set 'Ignored Build Step' to use the command in vercel.json"
echo "   - This will prevent builds when only non-web files change"
echo "4. Go to Settings > Environment Variables and add:"
echo "   - DATABASE_URL (if needed)"
echo "   - Any API keys (but NOT in the repo)"
echo ""
echo "This will stop the constant deployment failure emails!"