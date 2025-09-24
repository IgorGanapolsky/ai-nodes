#!/bin/bash

echo "🤖 Auto-approving and merging Dependabot PRs..."

# GitHub Actions updates - always safe to merge
for pr in 2 3; do
  echo "✅ Approving PR #$pr (GitHub Actions)"
  gh pr review $pr --approve --body "Auto-approved: GitHub Actions update"
  gh pr merge $pr --squash --auto
done

# Dev dependencies - safe to merge
for pr in 8 12 13; do
  echo "✅ Approving PR #$pr (Dev dependency)"
  gh pr review $pr --approve --body "Auto-approved: Dev dependency update"
  gh pr merge $pr --squash --auto
done

# Minor/patch updates - review individually
echo ""
echo "⚠️  The following PRs need review (major updates or prod dependencies):"
echo "  #4  - @radix-ui/react-toast (minor update, prod)"
echo "  #5  - @fastify/swagger-ui (major update)"
echo "  #6  - p-retry (major update)"
echo "  #7  - playwright (minor update)"
echo "  #9  - @hookform/resolvers (major update)"
echo "  #10 - fastify (major update)"
echo "  #14 - conf (major update)"
echo ""
echo "Review these manually or run: gh pr merge <number> --squash"
