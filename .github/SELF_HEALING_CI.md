# Self-Healing CI System

This repository includes an advanced self-healing CI system that automatically detects and fixes common CI failures, ensuring near 100% uptime for your continuous integration pipeline.

## 🌟 Features

### Automatic Healing Capabilities

1. **Dependency Conflicts** 🔧
   - Auto-regenerates lockfiles
   - Updates outdated dependencies
   - Resolves version conflicts
   - Prunes unused packages

2. **Lint Errors** 🎨
   - Auto-fixes ESLint issues
   - Applies Prettier formatting
   - Organizes imports
   - Removes unused code

3. **Type Errors** 🔬
   - Adds temporary type suppressions
   - Generates missing type definitions
   - Applies type assertions
   - Uses optional chaining for safety

4. **Test Failures** 🧪
   - Skips flaky tests temporarily
   - Increases timeouts for slow tests
   - Adds missing mocks
   - Fixes common testing issues

5. **AI-Powered Diagnosis** 🤖
   - Analyzes complex failure patterns
   - Creates detailed diagnosis reports
   - Suggests manual fixes for edge cases
   - Tracks failure trends

## 🚀 How It Works

### Trigger Conditions

The self-healing system activates when:

- The main CI workflow fails
- Manual trigger via workflow_dispatch
- Specific failure patterns are detected

### Healing Process

1. **Detection**: System detects CI failure
2. **Analysis**: Identifies failure type(s)
3. **Parallel Healing**: Runs healing strategies in parallel
4. **Verification**: Tests that fixes work
5. **PR Creation**: Creates pull request with fixes
6. **AI Diagnosis**: Provides detailed analysis if needed
7. **Re-trigger**: Automatically re-runs CI

### Workflow Structure

```
CI Failure Detected
         ↓
   Check CI Status
         ↓
    Self-Heal Jobs (Parallel)
    ├── Dependencies
    ├── Lint
    ├── Types
    └── Tests
         ↓
    Verification
         ↓
    Create Healing PRs
         ↓
    AI Diagnosis (if needed)
         ↓
    Re-trigger CI
         ↓
    Notify Results
```

## 📋 Configuration

The self-healing system is configured via `.github/self-heal.config.yml`:

### Basic Settings

```yaml
healing:
  enabled:
    dependencies: true
    lint: true
    types: true
    tests: true
    ai_diagnosis: true

  aggressiveness:
    dependencies: moderate
    lint: aggressive
    types: conservative
    tests: moderate
```

### Auto-Merge Settings

```yaml
auto_merge:
  enabled: false # Enable for automatic merging
  conditions:
    - all_checks_pass: true
    - no_conflicts: true
    - max_age_hours: 24
    - require_review: true
```

### Notifications

```yaml
notifications:
  github:
    create_issues: true
    labels:
      - 'ci-failure'
      - 'auto-heal'
      - 'needs-review'
```

## 🛠️ Manual Usage

### Trigger Specific Healing

You can manually trigger healing for specific issues:

```bash
# Via GitHub CLI
gh workflow run self-heal.yml -f heal_type=dependencies
gh workflow run self-heal.yml -f heal_type=lint
gh workflow run self-heal.yml -f heal_type=types
gh workflow run self-heal.yml -f heal_type=tests
gh workflow run self-heal.yml -f heal_type=all

# Force healing even if CI passed
gh workflow run self-heal.yml -f force_heal=true
```

### Using Healing Utils Script

The system includes advanced healing utilities:

```bash
# From repository root
node .github/scripts/healing-utils.js dependencies
node .github/scripts/healing-utils.js lint
node .github/scripts/healing-utils.js types
node .github/scripts/healing-utils.js tests
node .github/scripts/healing-utils.js all
```

## 🔍 Monitoring and Metrics

### Success Tracking

The system tracks:

- Healing attempt frequency
- Success rates by failure type
- Time to resolve issues
- Most common failure patterns
- Effectiveness of different strategies

### GitHub Issues

When complex issues occur:

- Automatic GitHub issues are created
- Detailed diagnosis reports are included
- Suggested manual fixes are provided
- Issues are labeled for easy filtering

## ⚠️ Safety Measures

### Protected Operations

The system includes several safety measures:

1. **Rate Limiting**: Maximum 10 healing attempts per day
2. **Cooldown**: 30-minute cooldown between attempts
3. **Failure Rate Check**: Skips healing if failure rate exceeds 80%
4. **Protected Files**: Never modifies critical configuration files
5. **Manual Review**: Certain changes always require human review

### File Protection

These files are never automatically modified:

- `package.json` (only lockfile updates)
- Core configuration files
- Security-related files
- The CI workflow itself

## 🎯 Best Practices

### For Maintainers

1. **Review Healing PRs**: Always review auto-generated PRs before merging
2. **Monitor Patterns**: Watch for recurring issues that need permanent fixes
3. **Update Config**: Adjust healing strategies based on project needs
4. **Manual Fixes**: Address temporary suppressions and skipped tests

### For Developers

1. **Don't Rely Solely**: Use healing as a safety net, not primary development flow
2. **Fix Root Causes**: Address underlying issues causing repeated failures
3. **Test Locally**: Always test changes locally before pushing
4. **Review Healing**: Check what the system fixed and learn from it

## 🔧 Advanced Configuration

### Custom Healing Strategies

You can customize healing behavior for specific error patterns:

```yaml
strategies:
  dependencies:
    conflicts:
      react:
        strategy: 'pin_to_latest_stable'
        version: '^18.3.0'

  lint:
    eslint:
      auto_fix: true
      ignore_patterns:
        - '*.d.ts'
        - 'build/'

  types:
    typescript:
      suppression_method: 'comment'
      add_type_assertions: true

  tests:
    vitest:
      increase_timeout: true
      retry_flaky_tests: 3
```

### AI Diagnosis Configuration

```yaml
ai_diagnosis:
  enabled: true
  analysis:
    capture_logs: true
    max_log_lines: 1000
    analyze_stack_traces: true
  reports:
    create_github_issue: true
    suggest_fixes: true
```

## 📊 Effectiveness Metrics

### Target Outcomes

- **99%+ CI Uptime**: Maintain functional CI pipeline
- **<5 minute** average healing time
- **<1 hour** maximum time to resolve issues
- **80%+ automatic resolution** rate for common issues

### Monitoring

Track these KPIs:

- Mean Time To Recovery (MTTR)
- Healing success rate by category
- False positive rate
- Developer satisfaction with auto-fixes

## 🆘 Troubleshooting

### Common Issues

1. **Healing Not Triggering**
   - Check workflow permissions
   - Verify trigger conditions in config
   - Ensure GITHUB_TOKEN has required permissions

2. **Healing Fails**
   - Review healing logs in Actions tab
   - Check for protected file modifications
   - Verify dependency versions are valid

3. **Too Aggressive Healing**
   - Adjust aggressiveness levels in config
   - Add more files to protection list
   - Enable manual review requirements

4. **Missing Dependencies**
   - Ensure all required tools are available in CI
   - Check node version compatibility
   - Verify package manager setup

### Emergency Disabling

To disable the self-healing system:

1. **Immediate**: Comment out the workflow trigger in `self-heal.yml`
2. **Temporary**: Set all healing types to `false` in config
3. **Permanent**: Delete the workflow file

### Getting Help

If you encounter issues:

1. Check the [GitHub Actions logs](../../actions)
2. Review auto-created diagnostic issues
3. Examine the healing configuration
4. Contact the development team

## 📚 Technical Details

### Architecture

The system consists of:

- **Main Workflow** (`.github/workflows/self-heal.yml`)
- **Healing Utilities** (`.github/scripts/healing-utils.js`)
- **Configuration** (`.github/self-heal.config.yml`)
- **Documentation** (this file)

### Dependencies

- Node.js 20+ with PNPM
- GitHub Actions with appropriate permissions
- Standard development tools (ESLint, Prettier, TypeScript, etc.)

### Permissions Required

```yaml
permissions:
  contents: write # For creating commits and branches
  pull-requests: write # For creating healing PRs
  actions: write # For triggering workflow re-runs
  checks: read # For reading CI status
  issues: write # For creating diagnostic issues
```

## 🔮 Future Enhancements

Planned improvements:

- Machine learning for better failure prediction
- Integration with external monitoring tools
- Advanced dependency vulnerability healing
- Automatic performance regression fixes
- Multi-repository healing coordination

---

_This self-healing CI system is designed to maintain high availability while learning from failures. It's a safety net that helps maintain productivity, but should not replace good development practices._
