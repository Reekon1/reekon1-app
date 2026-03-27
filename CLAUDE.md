# Reekon

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/plan-ceo-review` — CEO/founder-mode plan review
- `/plan-eng-review` — Eng manager-mode plan review
- `/review` — Pre-landing PR review
- `/ship` — Ship workflow (merge, test, review, bump, PR)
- `/browse` — Fast headless browser for QA and dogfooding
- `/qa` — Systematic QA testing
- `/setup-browser-cookies` — Import cookies for authenticated testing
- `/retro` — Weekly engineering retrospective

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.
