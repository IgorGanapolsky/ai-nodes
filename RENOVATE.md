# 🤖 Ultra-Aggressive Renovate Configuration

This repository has been configured with **maximum automation** using Renovate Bot. Speed is our competitive advantage!

## 🚀 What's Enabled

### Automatic Updates (ALL AUTO-MERGED!)
- ✅ **Patch updates** - Auto-merged immediately
- ✅ **Minor updates** - Auto-merged immediately
- ✅ **Major updates** - Auto-merged immediately (YOLO mode!)
- ✅ **Security updates** - Auto-merged immediately
- ✅ **Docker base images** - Auto-merged immediately
- ✅ **GitHub Actions** - Auto-merged immediately
- ✅ **Lock file maintenance** - Auto-merged immediately

### Ultra-Aggressive Settings
- **Schedule**: Every hour (not waiting for weekly!)
- **PR Concurrent Limit**: 20 PRs at once
- **Branch Concurrent Limit**: 20 branches at once
- **PR Hourly Limit**: ∞ (no limits!)
- **Auto-merge Type**: Branch (merges before CI even completes when safe)
- **Range Strategy**: Bump (always use latest)

## 📁 Configuration Files

### Primary Configuration
- `renovate.json` - Main ultra-aggressive configuration
- `.renovaterc` - Renovate runtime configuration
- `.github/renovate.json5` - Advanced JSON5 config with comments
- `.github/workflows/renovate.yml` - GitHub Action for self-hosted runs

### Monitoring
- **Dependency Dashboard**: Auto-created issue showing all pending updates
- **Labels**: All PRs tagged with `dependencies`, `renovate`, `auto-merge`, `fast-track`

## 🎯 Package Categories

### Production Dependencies
- Auto-merged immediately after CI passes
- Labeled with `prod-deps`

### Development Dependencies
- Auto-merged immediately (even faster)
- Labeled with `dev-deps`

### Special Categories
- **TypeScript & @types/\***: Immediate updates
- **Testing frameworks**: Jest, Vitest, Cypress, Playwright
- **Linting & formatting**: ESLint, Prettier
- **Build tools**: Webpack, Vite, Rollup, ESBuild
- **React ecosystem**: React, Next.js
- **Node.js runtime**: Auto-updated

## 🐳 Docker Support

Renovate will automatically update:
- Base images in Dockerfiles
- Docker Compose images
- Container tags in YAML files

## ⚡ GitHub Actions

All GitHub Action versions are automatically bumped to latest:
- No digest pinning (always use latest tags)
- Actions from marketplace auto-updated
- Custom actions auto-updated

## 📊 Monitoring & Dashboards

### Dependency Dashboard
Check the automatically created **"🤖 Renovate Dashboard - AGGRESSIVE MODE"** issue for:
- All pending updates
- Failed updates that need attention
- Configuration status

### PR Labels
All Renovate PRs are labeled for easy filtering:
- `dependencies` - All dependency updates
- `renovate` - Renovate bot PRs
- `auto-merge` - Will be auto-merged
- `fast-track` - High priority updates
- `major-update` - Major version bumps
- `dev-deps` - Development dependencies
- `prod-deps` - Production dependencies
- `github-actions` - Action updates
- `docker` - Container updates

## 🚨 Security

### Vulnerability Handling
- **Vulnerability alerts**: Auto-merged immediately
- **Security updates**: Highest priority, merged ASAP
- **No manual approval required**: Speed over bureaucracy

### Safety Features
- **CI must pass** before auto-merge (when configured)
- **Branch protection rules** still apply
- **Status checks** are respected

## 🛠️ Customization

### Disable Auto-merge for Specific Packages
Add to `renovate.json`:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["dangerous-package"],
      "automerge": false
    }
  ]
}
```

### Schedule Changes
Current: Every hour. To modify:

```json
{
  "schedule": ["before 6am on monday"]
}
```

### Grouping Updates
Current: Individual PRs. To group:

```json
{
  "packageRules": [
    {
      "matchPackagePatterns": ["^@types/"],
      "groupName": "TypeScript definitions",
      "groupSlug": "types"
    }
  ]
}
```

## 📈 Performance Metrics

This ultra-aggressive setup provides:
- **~1 hour** maximum delay for updates
- **20x concurrent processing** vs default
- **Zero manual intervention** required
- **Immediate security patches**
- **Always-current dependencies**

## 🚀 Benefits

1. **Security**: Always latest security patches
2. **Performance**: Latest optimizations and bug fixes
3. **Developer Experience**: Latest features and APIs
4. **Maintenance**: Zero manual dependency management
5. **Competitive Advantage**: Always running on cutting-edge stack

## ⚠️ Risk Management

This configuration prioritizes **speed over caution**. If you need more control:

1. **Disable major updates**: Set `major.automerge: false`
2. **Add manual approval**: Remove `automerge: true`
3. **Reduce concurrency**: Lower `prConcurrentLimit`
4. **Add reviewers**: Set `reviewers: ["@username"]`

## 🏃‍♂️ Getting Started

1. **Enable Renovate App**: Install from GitHub Marketplace
2. **Push configuration**: Commit `renovate.json` to repository
3. **Wait**: First run happens within an hour
4. **Monitor**: Check Dependency Dashboard issue

---

**Speed is our competitive advantage!** 🚀

*This configuration embodies the philosophy that staying current is safer than staying behind.*