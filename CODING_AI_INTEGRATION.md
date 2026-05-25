# Coding AI Integration Guide

This guide shows how to integrate various AI coding assistants with your AI Memory Bank.

## Supported AI Providers

- ✅ **Groq** (Llama 3.1) - Fast, already configured
- ✅ **OpenAI** (GPT-4, Codex) - Most capable
- ✅ **Anthropic Claude** (Claude 3.5 Sonnet) - Great for code analysis
- 🚧 **Amazon Q Developer** - Requires AWS SDK setup

## Quick Start

### 1. Install Dependencies

No additional dependencies needed! Uses native `fetch` API.

### 2. Configure API Keys

Copy the example environment file:

```bash
cp .env.coding-ai.example .env.local
```

Add your API key(s):

```bash
# Choose one or more providers
GROQ_API_KEY=gsk_your_key_here
OPENAI_API_KEY=sk-your_key_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

### 3. Test the Integration

```bash
node scripts/test-coding-ai.js
```

## Usage Examples

### Basic Code Analysis

```typescript
import { generateCodeInsight } from "@/lib/coding-ai";

const insight = await generateCodeInsight(
  {
    file_path: "src/components/Button.tsx",
    language: "typescript",
    code_snippet: "export function Button() { ... }",
    change_description: "Added loading state",
    framework: "react",
    dependencies: ["react"],
  },
  "groq" // or "openai", "claude"
);

console.log(insight.understanding);
console.log(insight.next_steps);
```

### Full Workflow: Store to Arkiv

```typescript
import { storeCodeChangeToArkiv } from "@/lib/coding-ai-examples";

const result = await storeCodeChangeToArkiv();
// Stores: Memory → Context → AI Insight to blockchain
```

### API Endpoint Usage

```bash
curl -X POST http://localhost:3000/api/code-insights/generate \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "src/utils/validation.ts",
    "language": "typescript",
    "code_snippet": "export function validateEmail(email: string) { ... }",
    "change_description": "Added email validation",
    "provider": "groq"
  }'
```

## Response Format

```json
{
  "understanding": "Implemented email validation using regex pattern...",
  "next_steps": [
    "Add unit tests for edge cases",
    "Consider using a validation library like Zod",
    "Add error messages for better UX"
  ],
  "related_patterns": [
    "Input validation pattern",
    "Form handling best practices"
  ],
  "potential_issues": [
    "Regex may not catch all invalid emails",
    "Consider internationalized email addresses"
  ]
}
```

## Code Schema Extensions

The project includes extended types for coding use cases:

```typescript
type CodeMemoryPayload = {
  content: string;
  file_path: string;
  language: string;
  framework?: string;
  git_commit?: string;
  code_diff?: string;
  lines_changed?: number;
};
```

## Coding Modifiers

Use these modifiers to categorize code changes:

- `feature:` - New functionality
- `bugfix:` - Bug fixes
- `refactor:` - Code improvements
- `test:` - Test additions
- `docs:` - Documentation
- `style:` - Code formatting
- `perf:` - Performance improvements
- `security:` - Security fixes
- `deps:` - Dependency updates

## Provider Comparison

| Provider | Speed | Cost | Code Quality | Best For |
|----------|-------|------|--------------|----------|
| Groq | ⚡⚡⚡ | 💰 Free tier | ⭐⭐⭐ | Fast prototyping |
| OpenAI | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ | Production use |
| Claude | ⚡⚡ | 💰💰 | ⭐⭐⭐⭐ | Code analysis |
| Amazon Q | ⚡⚡ | 💰💰 | ⭐⭐⭐⭐ | AWS integration |

## Next Steps

1. **CLI Tool**: Build a CLI to capture git commits automatically
2. **IDE Extension**: VS Code extension for real-time capture
3. **Git Hooks**: Auto-capture on commit
4. **Dashboard**: Visualize code evolution over time

## Troubleshooting

**Error: API key not configured**
- Make sure you've added the API key to `.env.local`
- Restart your dev server after adding keys

**Error: Rate limit exceeded**
- Switch to a different provider
- Implement request throttling

**Error: Invalid JSON response**
- The AI sometimes returns markdown. The parser handles this automatically
- Check the `parseCodeInsight` function for edge cases

## Examples

See `src/lib/coding-ai-examples.ts` for complete working examples.
