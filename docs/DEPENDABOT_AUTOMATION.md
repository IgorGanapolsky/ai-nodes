# Dependabot Automation Setup

This repository is configured for **fully automated dependency management** using GitHub Dependabot with auto-merge capabilities.

## 🚀 Features

### Automated Handling

- **Auto-approve & merge**: Patch and minor updates are automatically approved and merged
- **Grouped updates**: Dependencies are grouped to reduce PR noise
- **Smart categorization**: Separate groups for production, development, and major updates
- **Zero manual intervention**: You never need to handle routine dependency updates

### Security & Control

- **Major update protection**: Major version bumps require manual review
- **CI/CD validation**: All PRs must pass tests before auto-merging
- **Selective automation**: Critical packages (React, Next.js) major updates are excluded from automation

## 📋 Configuration Overview

### 1. Dependabot Configuration (`.github/dependabot.yml`)

- **Schedule**: Weekly updates on Monday at 3:00 AM
- **PR Limit**: Maximum 5 open PRs per ecosystem
- **Grouping Strategy**:
  - Production dependencies (minor/patch)
  - Development dependencies (minor/patch)
  - Major updates (separate group for visibility)

### 2. Auto-Merge Workflow (`.github/workflows/auto-merge-dependabot.yml`)

- Triggers on Dependabot PRs
- Auto-approves patch and minor updates
- Auto-merges approved PRs after CI passes
- Labels major updates for manual review

### 3. Repository Settings

✅ Auto-merge enabled
✅ GitHub Actions can approve PRs
✅ Branch protection with required reviews
✅ Status checks required before merge

## 🔧 Manual Intervention Required

You only need to manually review:

1. **Major version updates** (labeled with `major-update`)
2. **Security vulnerabilities** in dependencies
3. **Breaking changes** that fail CI/CD

## 📊 Expected Behavior

### Weekly Schedule

Every Monday at 3 AM:

1. Dependabot creates grouped PRs for updates
2. Auto-merge workflow runs immediately
3. Minor/patch updates are approved and queued for merge
4. CI/CD runs on all PRs
5. Successful PRs are automatically merged
6. Major updates wait for your review

### PR Volume Reduction

**Before**: 10-20 individual PRs per week
**After**: 2-4 grouped PRs per week (mostly auto-handled)

## 🛠️ Maintenance Commands

### Trigger Manual Update

```bash
# On any closed Dependabot PR
@dependabot recreate
```

### Check Automation Status

```bash
# View pending Dependabot PRs
gh pr list --author "dependabot[bot]" --state open

# View auto-merge status
gh pr list --search "is:pr is:open auto-merge:enabled"
```

### Cleanup Script

```bash
# Close all existing PRs to trigger regrouping
./scripts/cleanup-dependabot-prs.sh
```

## 🔍 Monitoring

### Slack/Email Notifications (Optional)

Add to workflow for major updates:

```yaml
- name: Notify on major update
  if: steps.metadata.outputs.update-type == 'version-update:semver-major'
  # Add your notification action here
```

## 🚨 Troubleshooting

### PRs Not Auto-Merging

1. Check CI/CD status - tests must pass
2. Verify branch protection settings
3. Ensure GitHub Actions has approval permissions

### Too Many PRs

1. Adjust `open-pull-requests-limit` in dependabot.yml
2. Review grouping configuration
3. Run cleanup script to reset

### Security Alerts

Security updates bypass normal scheduling and grouping. They will:

- Open immediately when detected
- Not auto-merge (require manual review)
- Be labeled as `security`

## 📚 References

- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependabot Auto-merge Guide](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
- [Grouped Updates (Beta)](https://github.blog/changelog/2023-06-30-grouped-version-updates-for-dependabot-public-beta/)
