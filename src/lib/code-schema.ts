/**
 * Extended schema for coding AI use case
 */

import type { MemoryNodePayload, MemoryContextPayload, AgentInsightPayload } from "./schema";

// Code-specific memory payload
export type CodeMemoryPayload = MemoryNodePayload & {
  file_path?: string;
  language?: string;
  framework?: string;
  git_commit?: string;
  code_diff?: string;
  lines_changed?: number;
};

// Code-specific context
export type CodeContextPayload = MemoryContextPayload & {
  coding_pattern?: string;
  dependencies?: string[];
  related_files?: string[];
  test_coverage?: number;
};

// Code-specific insight
export type CodeInsightPayload = AgentInsightPayload & {
  next_steps?: string[];
  related_patterns?: string[];
  potential_issues?: string[];
  complexity_score?: number;
};

// Coding modifiers
export const CODE_MODIFIERS = [
  "feature:",
  "bugfix:",
  "refactor:",
  "test:",
  "docs:",
  "style:",
  "perf:",
  "security:",
  "deps:",
] as const;

export type CodeModifier = typeof CODE_MODIFIERS[number];

// Helper to create code memory
export function createCodeMemory(input: {
  content: string;
  file_path: string;
  language: string;
  change_description: string;
  framework?: string;
  git_commit?: string;
  code_diff?: string;
}): CodeMemoryPayload {
  return {
    content: input.content,
    domain: input.file_path.split("/")[0] || "root",
    visibility: "private",
    contentMode: "plaintext",
    file_path: input.file_path,
    language: input.language,
    framework: input.framework,
    git_commit: input.git_commit,
    code_diff: input.code_diff,
    lines_changed: input.code_diff?.split("\n").length,
  };
}

// Helper to create code context
export function createCodeContext(input: {
  memoryKey: string;
  reason: string;
  coding_pattern: string;
  dependencies?: string[];
  related_files?: string[];
}): CodeContextPayload {
  return {
    memoryKey: input.memoryKey,
    context: input.reason,
    interpreter: "code-analyzer-v1",
    authority: "developer",
    modifiers: [input.coding_pattern],
    coding_pattern: input.coding_pattern,
    dependencies: input.dependencies,
    related_files: input.related_files,
  };
}

// Helper to create code insight
export function createCodeInsight(input: {
  memoryKey: string;
  memoryContextKey: string;
  understanding: string;
  next_steps: string[];
  related_patterns: string[];
  potential_issues: string[];
  model: string;
}): CodeInsightPayload {
  return {
    memoryKey: input.memoryKey,
    memoryContextKey: input.memoryContextKey,
    insight: input.understanding,
    model: input.model,
    interpreter: "code-analyzer-v1",
    contentMode: "plaintext",
    next_steps: input.next_steps,
    related_patterns: input.related_patterns,
    potential_issues: input.potential_issues,
    lineageDepth: 0,
  };
}

// Language detection helper
export function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    go: "go",
    rs: "rust",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
  };
  return languageMap[ext || ""] || "unknown";
}

// Framework detection helper
export function detectFramework(content: string, language: string): string | undefined {
  if (language === "typescript" || language === "javascript") {
    if (content.includes("from 'react'") || content.includes('from "react"')) return "react";
    if (content.includes("from 'vue'") || content.includes('from "vue"')) return "vue";
    if (content.includes("from 'next")) return "nextjs";
    if (content.includes("from '@angular")) return "angular";
  }
  if (language === "python") {
    if (content.includes("from django")) return "django";
    if (content.includes("from flask")) return "flask";
    if (content.includes("import fastapi")) return "fastapi";
  }
  return undefined;
}
