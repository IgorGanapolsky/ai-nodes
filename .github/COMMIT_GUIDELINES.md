# Commit Message Guidelines

This document provides guidelines for writing clear, professional commit messages in the ai-nodes repository.

## ❌ What NOT to Commit

### Never commit AI tool outputs as commit messages

**BAD Examples:**
```
[{"tool_use_id"=>"toolu_01CnY2ZN48kdyPiPihw9dHMG", "type"=>"tool_result", "content"=>"Todos have been modified successfully..."}]

{"tool_use_id": "toolu_015QPnP89Wuqmt89BBjUqV4R", "type": "tool_result", "content": "The file has been updated..."}
```

These are AI tool outputs, not commit messages. They provide no meaningful information about what changed in your code.

### Avoid overly dramatic language

**BAD Examples:**
```
🚀 CTO EMERGENCY FIX: Resolve all deployment issues
CEO OVERRIDE: Ultimate business automation achieved
I don't want to review anything manually. I am the CEO, you are my CTO...
```

Professional commit messages should be clear and factual, not dramatic or role-playing.

## ✅ Good Commit Message Format

Use the conventional commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

**GOOD Examples:**
```
feat(api): add device metrics endpoint

fix(db): resolve connection timeout issues

docs: update README with installation instructions

refactor(core): simplify earnings calculation logic

chore(deps): update dependencies to latest versions
```

## Setting Up the Commit Hook

To prevent accidental AI tool output commits, set up this git hook:

1. Copy the hook script:
```bash
cp .githooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

2. Or configure git to use the hooks directory:
```bash
git config core.hooksPath .githooks
```

## Pre-commit Checklist

Before committing, ask yourself:
- [ ] Does my commit message clearly describe what changed?
- [ ] Is it written in imperative mood ("add feature" not "added feature")?
- [ ] Does it avoid AI tool outputs or overly dramatic language?
- [ ] Is it under 50 characters for the subject line?
- [ ] Does the body (if present) explain why, not what?

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
