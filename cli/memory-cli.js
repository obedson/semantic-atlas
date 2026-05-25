#!/usr/bin/env node

/**
 * AI Memory Bank CLI
 * Captures git commits and stores them to Arkiv blockchain
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get git commit info
function getLastCommit() {
  try {
    const hash = execSync("git rev-parse HEAD").toString().trim();
    const message = execSync("git log -1 --pretty=%B").toString().trim();
    const author = execSync("git log -1 --pretty=%an").toString().trim();
    const date = execSync("git log -1 --pretty=%ai").toString().trim();
    const files = execSync("git diff-tree --no-commit-id --name-only -r HEAD")
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);

    return { hash, message, author, date, files };
  } catch (error) {
    console.error("❌ Not a git repository or no commits found");
    process.exit(1);
  }
}

// Get file diff
function getFileDiff(file) {
  try {
    const diff = execSync(`git diff HEAD~1 HEAD -- ${file}`).toString();
    
    // Check if binary file
    if (diff.includes("Binary files")) {
      console.log(`   (Binary file, getting content instead)`);
      const content = execSync(`git show HEAD:${file}`).toString();
      return content.slice(-1500); // Last 1500 chars
    }
    
    // If no diff (new file), get the content
    if (!diff.trim()) {
      return execSync(`git show HEAD:${file}`).toString().slice(0, 1500);
    }
    return diff.slice(0, 1500); // Limit to 1500 chars
  } catch {
    return "// File content unavailable";
  }
}

// Detect language from file extension
function detectLanguage(filePath) {
  const ext = path.extname(filePath).slice(1);
  const map = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", java: "java", go: "go", rs: "rust", rb: "ruby",
    php: "php", cpp: "cpp", c: "c", cs: "csharp", swift: "swift", kt: "kotlin"
  };
  return map[ext] || "unknown";
}

// Categorize commit type
function categorizeCommit(message) {
  const lower = message.toLowerCase();
  if (lower.startsWith("feat") || lower.includes("feature")) return "feature:";
  if (lower.startsWith("fix") || lower.includes("bug")) return "bugfix:";
  if (lower.startsWith("refactor")) return "refactor:";
  if (lower.startsWith("test")) return "test:";
  if (lower.startsWith("docs")) return "docs:";
  if (lower.startsWith("style")) return "style:";
  if (lower.startsWith("perf")) return "perf:";
  if (lower.startsWith("security")) return "security:";
  return "feature:";
}

// Store to Arkiv
async function storeToArkiv(commitData) {
  const apiUrl = "http://localhost:3000";
  
  // Check if server is running
  try {
    const healthCheck = await fetch(apiUrl);
    if (!healthCheck.ok) {
      console.log("\n❌ Dev server not responding");
      console.log("   Run 'npm run dev' in another terminal first");
      return;
    }
  } catch (error) {
    console.log("\n❌ Cannot connect to dev server");
    console.log("   Run 'npm run dev' in another terminal first");
    return;
  }
  
  for (const file of commitData.files) {
    const language = detectLanguage(file);
    if (language === "unknown") continue;

    const diff = getFileDiff(file);
    
    console.log(`\n📝 Processing: ${file}`);
    
    // Skip if diff is too small or unavailable
    if (diff.length < 10) {
      console.log(`⚠️  Skipped: No meaningful changes`);
      continue;
    }
    
    const payload = {
      file_path: file,
      language,
      code_snippet: diff,
      change_description: commitData.message.split('\n')[0], // First line only
      provider: "groq",
    };
    
    // Debug: show what we're sending
    if (process.env.DEBUG) {
      console.log("Payload:", JSON.stringify(payload, null, 2));
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/code-insights/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️  Skipped: ${response.status} - ${errorText.slice(0, 100)}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Analyzed`);
      console.log(`   Understanding: ${data.insight.understanding.slice(0, 80)}...`);
      
      if (data.insight.next_steps.length > 0) {
        console.log(`   Next: ${data.insight.next_steps[0]}`);
      }
    } catch (error) {
      console.log(`⚠️  Skipped: ${error.message}`);
    }
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🧠 AI Memory Bank CLI\n");

  if (command === "capture" || command === "c") {
    const commit = getLastCommit();
    
    console.log("📦 Last Commit:");
    console.log(`   Hash: ${commit.hash.slice(0, 8)}`);
    console.log(`   Message: ${commit.message}`);
    console.log(`   Author: ${commit.author}`);
    console.log(`   Files: ${commit.files.length}`);
    console.log(`   Type: ${categorizeCommit(commit.message)}`);

    const shouldStore = args.includes("--store") || args.includes("-s");
    
    if (shouldStore) {
      console.log("\n🔄 Storing to Arkiv...");
      await storeToArkiv(commit);
      console.log("\n✨ Done!");
    } else {
      console.log("\n💡 Add --store to save to Arkiv");
    }
  } else if (command === "hook" || command === "h") {
    // Install git hook
    const hookPath = ".git/hooks/post-commit";
    const hookContent = `#!/bin/sh
# AI Memory Bank auto-capture
node cli/memory-cli.js capture --store
`;
    
    fs.writeFileSync(hookPath, hookContent);
    fs.chmodSync(hookPath, "755");
    
    console.log("✅ Git hook installed!");
    console.log("   Commits will auto-capture to Arkiv");
  } else if (command === "unhook") {
    const hookPath = ".git/hooks/post-commit";
    if (fs.existsSync(hookPath)) {
      fs.unlinkSync(hookPath);
      console.log("✅ Git hook removed");
    } else {
      console.log("ℹ️  No hook installed");
    }
  } else {
    console.log("Usage:");
    console.log("  memory capture          Show last commit info");
    console.log("  memory capture --store  Analyze and store to Arkiv");
    console.log("  memory hook             Install git post-commit hook");
    console.log("  memory unhook           Remove git hook");
    console.log("\nAliases:");
    console.log("  c = capture");
    console.log("  h = hook");
  }
}

main().catch(console.error);
