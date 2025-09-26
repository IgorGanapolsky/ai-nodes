#!/bin/bash

# Script to clean up existing Dependabot PRs by grouping and re-creating them
# This will close existing PRs and trigger Dependabot to create grouped PRs

echo "🧹 Starting Dependabot PR cleanup..."

# Get all open Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "dependabot[bot]" --state open --json number,title --limit 100)

if [ $(echo "$DEPENDABOT_PRS" | jq length) -eq 0 ]; then
    echo "✅ No open Dependabot PRs found"
    exit 0
fi

echo "Found $(echo "$DEPENDABOT_PRS" | jq length) open Dependabot PRs"

# Close all existing Dependabot PRs with a comment
echo "$DEPENDABOT_PRS" | jq -r '.[] | .number' | while read -r PR_NUMBER; do
    echo "Closing PR #$PR_NUMBER..."
    gh pr close "$PR_NUMBER" --comment "Closing this PR to enable grouped dependency updates. Dependabot will create new grouped PRs based on the updated configuration."
done

echo "✅ All existing Dependabot PRs have been closed"
echo ""
echo "📝 Next steps:"
echo "1. Dependabot will create new grouped PRs within the next scheduled run (Monday 3:00 AM)"
echo "2. The auto-merge workflow will handle these PRs automatically"
echo "3. Minor and patch updates will be auto-approved and merged"
echo "4. Major updates will be labeled for manual review"
echo ""
echo "To trigger Dependabot manually, you can:"
echo "- Use '@dependabot recreate' comment on a closed PR"
echo "- Or wait for the next scheduled run"