# Vercel Deployment Guide

This guide explains how to prevent Vercel deployment errors and ensure consistent, reliable deployments.

## 🚀 Quick Start

Before deploying to Vercel, always run:

```bash
pnpm run pre-deploy
```

This will validate your deployment and catch issues before they reach Vercel.

## 🛡️ Error Prevention System

### 1. Pre-Deployment Validation

The `scripts/vercel-pre-deploy.sh` script performs comprehensive validation:

- ✅ Node.js version compatibility
- ✅ PNPM installation and version
- ✅ Dependency installation with frozen lockfile
- ✅ Lint validation
- ✅ TypeScript type checking
- ✅ Build validation
- ✅ Environment configuration
- ✅ Vercel configuration validation

### 2. Automated CI/CD Protection

The `.github/workflows/vercel-deployment-guard.yml` workflow:

- Runs on every push and PR
- Validates deployment readiness
- Auto-fixes common issues
- Creates alerts for persistent failures
- Provides deployment summaries

### 3. Health Monitoring

The `scripts/deployment-health-monitor.js` script:

- Monitors deployment health
- Detects common issues
- Applies automatic fixes
- Tracks failure patterns
- Generates alerts

## 🔧 Common Issues and Solutions

### Issue 1: Lint Errors
**Symptoms**: ESLint errors in CI/CD
**Solution**: 
```bash
pnpm run lint --fix
pnpm run format
```

### Issue 2: TypeScript Errors
**Symptoms**: Type checking failures
**Solution**: 
```bash
pnpm run type-check
# Fix type errors manually
```

### Issue 3: Build Failures
**Symptoms**: Build process fails
**Solution**: 
```bash
pnpm run clean
pnpm install --frozen-lockfile
pnpm run build
```

### Issue 4: Dependency Issues
**Symptoms**: Package installation failures
**Solution**: 
```bash
rm -f pnpm-lock.yaml
pnpm install
```

### Issue 5: Environment Variables
**Symptoms**: Missing environment variables
**Solution**: 
- Check `.env.example` for required variables
- Set variables in Vercel dashboard
- Validate locally with `.env.local`

## 📋 Deployment Checklist

Before deploying to Vercel:

- [ ] Run `pnpm run pre-deploy`
- [ ] All tests pass
- [ ] No lint errors
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] Environment variables configured
- [ ] Vercel configuration is valid

## 🔍 Monitoring and Alerts

### GitHub Actions Integration

The system automatically:
- Validates every deployment
- Fixes common issues
- Creates GitHub issues for failures
- Provides detailed logs

### Manual Monitoring

Run health checks manually:
```bash
pnpm run health:check
```

### Log Files

Check logs in:
- `logs/vercel-validation-*.log`
- `logs/deployment-health.log`

## ⚙️ Configuration

### Vercel Configuration (`vercel.json`)

Key settings for reliable deployments:

```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "production",
    "CI": "true"
  },
  "build": {
    "env": {
      "NODE_ENV": "production",
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  }
}
```

### Package.json Scripts

Available scripts:
- `pnpm run vercel:validate` - Run pre-deployment validation
- `pnpm run pre-deploy` - Complete pre-deployment check
- `pnpm run health:check` - Run health monitoring
- `pnpm run deployment:monitor` - Monitor deployment health

## 🚨 Troubleshooting

### If Deployment Fails

1. **Check GitHub Actions logs**
   - Go to Actions tab in GitHub
   - Review failed workflow logs
   - Look for specific error messages

2. **Run local validation**
   ```bash
   pnpm run pre-deploy
   ```

3. **Check Vercel dashboard**
   - Review build logs
   - Check environment variables
   - Verify domain configuration

4. **Manual fixes**
   ```bash
   # Fix lint issues
   pnpm run lint --fix
   
   # Fix formatting
   pnpm run format
   
   # Regenerate dependencies
   rm -f pnpm-lock.yaml
   pnpm install
   
   # Clean and rebuild
   pnpm run clean
   pnpm run build
   ```

### Emergency Recovery

If all else fails:

1. **Revert to last working commit**
   ```bash
   git revert HEAD
   git push
   ```

2. **Force rebuild**
   - Go to Vercel dashboard
   - Trigger manual deployment
   - Use previous working commit

3. **Contact support**
   - Check GitHub issues for similar problems
   - Create new issue with logs
   - Contact Vercel support if needed

## 📚 Best Practices

1. **Always validate before deploying**
2. **Keep dependencies up to date**
3. **Use frozen lockfiles in production**
4. **Monitor deployment health regularly**
5. **Set up proper environment variables**
6. **Test builds locally before pushing**
7. **Review CI/CD logs regularly**
8. **Keep Vercel configuration simple**

## 🔗 Related Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PNPM Documentation](https://pnpm.io/motivation)
- [GitHub Actions](https://docs.github.com/en/actions)

---

*This guide is automatically updated by the deployment system. Last updated: $(date)*
