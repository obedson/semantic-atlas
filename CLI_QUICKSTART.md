# CLI Quick Reference

## Setup (One-Time)

```bash
# Install auto-capture hook
npm run memory:hook
```

## Daily Usage

```bash
# Just commit normally - auto-captures!
git add .
git commit -m "feat: Your change"
```

## Manual Commands

```bash
# View last commit
npm run memory c

# Capture and store
npm run memory c -- -s

# Remove hook
npm run memory:unhook
```

## What It Does

```
git commit
    ↓
Analyzes code with AI
    ↓
Stores to Arkiv blockchain
    ↓
AI remembers for next session
```

## Example Output

```
📝 Processing: src/auth.ts
✅ Analyzed
   Understanding: Added JWT authentication...
   Next: Add refresh tokens
```

That's it! 🎉
