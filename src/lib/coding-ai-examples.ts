/**
 * Example: How to use the coding AI integration
 */

import { generateCodeInsight } from "./coding-ai";
import { createCodeMemory, createCodeContext, createCodeInsight, detectLanguage, detectFramework } from "./code-schema";
import { createMemoryNode, createMemoryContext, createAgentInsight } from "./arkiv";

// Example 1: Simple code change analysis
async function analyzeCodeChange() {
  const filePath = "src/components/Button.tsx";
  const codeSnippet = `
export function Button({ onClick, loading, children }: ButtonProps) {
  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className="btn"
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}`;

  const changeDescription = "Added loading state to Button component with spinner";

  // Generate AI insight
  const insight = await generateCodeInsight(
    {
      file_path: filePath,
      language: "typescript",
      code_snippet: codeSnippet,
      change_description: changeDescription,
      framework: "react",
      dependencies: ["react"],
    },
    "groq" // or "openai", "claude"
  );

  console.log("AI Understanding:", insight.understanding);
  console.log("Next Steps:", insight.next_steps);
  console.log("Potential Issues:", insight.potential_issues);

  return insight;
}

// Example 2: Full workflow - Store code change to Arkiv
async function storeCodeChangeToArkiv() {
  const filePath = "src/hooks/useAuth.ts";
  const codeSnippet = `
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}`;

  const changeDescription = "Created useAuth hook for authentication state management";

  // Step 1: Create code memory payload
  const memoryPayload = createCodeMemory({
    content: changeDescription,
    file_path: filePath,
    language: detectLanguage(filePath),
    change_description: changeDescription,
    framework: detectFramework(codeSnippet, "typescript"),
    code_diff: codeSnippet,
  });

  // Step 2: Write memory to Arkiv
  const { record: memoryRecord } = await createMemoryNode({
    content: memoryPayload.content,
    domain: memoryPayload.domain,
    visibility: "private",
    contentMode: "plaintext",
  });

  console.log("Memory stored:", memoryRecord.key);

  // Step 3: Create context (why this change was made)
  const contextPayload = createCodeContext({
    memoryKey: memoryRecord.key,
    reason: "Centralize authentication logic for reusability across components",
    coding_pattern: "feature:auth",
    dependencies: ["react", "firebase/auth"],
    related_files: ["src/lib/firebase.ts", "src/components/LoginForm.tsx"],
  });

  const { record: contextRecord } = await createMemoryContext({
    memoryKey: memoryRecord.key,
    context: contextPayload.context,
    interpreter: contextPayload.interpreter,
    authority: contextPayload.authority,
    modifiers: contextPayload.modifiers,
  });

  console.log("Context stored:", contextRecord.key);

  // Step 4: Generate AI insight
  const aiInsight = await generateCodeInsight(
    {
      file_path: filePath,
      language: "typescript",
      code_snippet: codeSnippet,
      change_description: changeDescription,
      framework: "react",
      dependencies: ["react", "firebase/auth"],
    },
    "groq"
  );

  // Step 5: Store insight to Arkiv
  const insightPayload = createCodeInsight({
    memoryKey: memoryRecord.key,
    memoryContextKey: contextRecord.key,
    understanding: aiInsight.understanding,
    next_steps: aiInsight.next_steps,
    related_patterns: aiInsight.related_patterns,
    potential_issues: aiInsight.potential_issues,
    model: "groq/llama-3.1-70b",
  });

  const { record: insightRecord } = await createAgentInsight({
    memoryKey: memoryRecord.key,
    memoryContextKey: contextRecord.key,
    insight: insightPayload.insight,
    model: insightPayload.model,
    interpreter: insightPayload.interpreter,
    contentMode: "plaintext",
  });

  console.log("Insight stored:", insightRecord.key);

  return {
    memory: memoryRecord,
    context: contextRecord,
    insight: insightRecord,
    aiAnalysis: aiInsight,
  };
}

// Example 3: Query previous code changes
async function queryPreviousChanges() {
  // This would use the existing Arkiv query functions
  // Filter by domain (file path), modifiers (feature:, bugfix:), etc.
  
  console.log("Query code changes by:");
  console.log("- File path (domain)");
  console.log("- Change type (modifier: feature:, bugfix:, etc.)");
  console.log("- Date range");
  console.log("- Framework/language");
}

// Example 4: API usage from frontend
async function frontendExample() {
  const response = await fetch("/api/code-insights/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_path: "src/utils/validation.ts",
      language: "typescript",
      code_snippet: "export function validateEmail(email: string) { ... }",
      change_description: "Added email validation utility",
      framework: "nextjs",
      dependencies: ["validator"],
      provider: "groq", // or "openai", "claude"
    }),
  });

  const data = await response.json();
  console.log("AI Insight:", data.insight);
}

export {
  analyzeCodeChange,
  storeCodeChangeToArkiv,
  queryPreviousChanges,
  frontendExample,
};
