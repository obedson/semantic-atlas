import { DEMO_AUTHORITY, DEMO_CONTEXT, DEMO_INTERPRETER } from "../src/lib/constants";
import { encryptString, decryptString } from "../src/lib/crypto";
import { buildReflectionPrompt } from "../src/lib/reflection";
import { createMemoryNodePayload } from "../src/lib/schema";

async function main() {
  const secret = "Memory that should not be stored in plaintext.";
  const envelope = await encryptString(secret, "contest-passphrase");
  const decrypted = await decryptString(envelope, "contest-passphrase");

  if (decrypted !== secret) {
    throw new Error("Encrypted payload round trip failed.");
  }

  const metadataOnly = createMemoryNodePayload({
    title: "Private Thinking Pattern",
    content: secret,
    contentMode: "metadata-only",
    contentPreview: "Private thinking pattern",
    domain: "personal-cognition",
    visibility: "private",
  });

  if ("content" in metadataOnly || metadataOnly.contentPreview !== "Private thinking pattern") {
    throw new Error("Metadata-only memory leaked raw content into payload.");
  }

  const prompt = buildReflectionPrompt({
    memoryContent: "I map contradictions before committing to a decision.",
    modifiers: ["expand:contradictions", "route:private-reasoning", "remember"],
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
    priorReflections: ["The user prefers pattern emergence over first-answer speed."],
  });

  for (const expected of [
    "I map contradictions",
    "expand:contradictions",
    DEMO_INTERPRETER,
    DEMO_CONTEXT,
    DEMO_AUTHORITY,
    "pattern emergence",
  ]) {
    if (!prompt.includes(expected)) {
      throw new Error(`Reflection prompt is missing: ${expected}`);
    }
  }

  console.log("local-smoke ok");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
