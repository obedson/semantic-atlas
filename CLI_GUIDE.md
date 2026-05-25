# AI Memory Bank CLI

Automatically capture git commits and store them to Arkiv blockchain with AI analysis.

## Installation

The CLI is already installed! Just use npm scripts.

## Usage

### View Last Commit

```bash
npm run memory capture
# or shorter
npm run memory c
```

Output:
```
🧠 AI Memory Bank CLI

📦 Last Commit:
   Hash: a1b2c3d4
   Message: Add user authentication
   Author: Your Name
   Files: 3
   Type: feature:

💡 Add --store to save to Arkiv
```

### Capture and Store to Arkiv

```bash
npm run memory capture -- --store
# or
npm run memory c -- -s
```

This will:
1. ✅ Get last commit info
2. ✅ Analyze each changed file with AI
3. ✅ Generate insights and next steps
4. ✅ Store to Arkiv blockchain

### Install Git Hook (Auto-capture)

```bash
npm run memory:hook
```

Now every `git commit` will automatically:
- Analyze your changes with AI
- Store to Arkiv blockchain
- No manual action needed!

### Remove Git Hook

```bash
npm run memory:unhook
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `capture` | `c` | Show last commit info |
| `capture --store` | `c -s` | Analyze and store to Arkiv |
| `hook` | `h` | Install auto-capture git hook |
| `unhook` | - | Remove git hook |

## Examples

### Manual Capture After Commit

```bash
git add .
git commit -m "feat: Add login form"
npm run memory c -- -s
```

### Automatic Capture (Recommended)

```bash
# One-time setup
npm run memory:hook

# Now just commit normally
git add .
git commit -m "feat: Add login form"
# ✨ Automatically captured to Arkiv!
```

### View Without Storing

```bash
npm run memory c
```

## What Gets Captured

For each file in your commit:

- ✅ File path
- ✅ Programming language
- ✅ Code changes (diff)
- ✅ Commit message
- ✅ Commit hash
- ✅ AI-generated insights
- ✅ Suggested next steps
- ✅ Potential issues

## AI Analysis Example

```
📝 Processing: src/auth/login.ts
✅ Analyzed
   Understanding: Implemented JWT-based authentication with bcrypt password hashing...
   Next: Add refresh token mechanism and rate limiting
```

## Configuration

The CLI uses your existing environment variables:

```bash
GROQ_API_KEY=your_key_here
NEXT_PUBLIC_ARKIV_RPC_URL=https://braga.hoodi.arkiv.network/rpc
```

## Workflow

### Option 1: Manual (On-Demand)

```bash
# Work on code
git add .
git commit -m "feat: Add feature"

# Capture when ready
npm run memory c -- -s
```

### Option 2: Automatic (Recommended)

```bash
# One-time setup
npm run memory:hook

# Work normally
git add .
git commit -m "feat: Add feature"
# ✨ Auto-captured!
```

## Troubleshooting

**Error: Not a git repository**
- Make sure you're in a git repository
- Run `git init` if needed

**Error: No commits found**
- Make at least one commit first
- Run `git commit -m "Initial commit"`

**Error: API error**
- Make sure dev server is running: `npm run dev`
- Check your API keys in `.env.local`

**Hook not working**
- Reinstall: `npm run memory:hook`
- Check `.git/hooks/post-commit` exists
- Make sure it's executable: `chmod +x .git/hooks/post-commit`

## Advanced Usage

### Direct CLI Access

```bash
node cli/memory-cli.js capture --store
node cli/memory-cli.js hook
```

### Custom Git Hook

Edit `.git/hooks/post-commit` to customize behavior:

```bash
#!/bin/sh
# Only capture main branch commits
if [ "$(git branch --show-current)" = "main" ]; then
  node cli/memory-cli.js capture --store
fi
```

## Benefits

✅ **Never forget why you made changes**
✅ **AI remembers your codebase evolution**
✅ **Get suggestions for next steps**
✅ **Portable memory across AI assistants**
✅ **Blockchain-backed audit trail**
✅ **Zero manual effort with git hooks**

## Next Steps

1. Install the hook: `npm run memory:hook`
2. Make a commit: `git commit -m "test"`
3. Watch it auto-capture! 🎉
