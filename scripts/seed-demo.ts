import { createWalletClient, jsonToPayload } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { config } from "dotenv";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  ARKIV_BRAGA_RPC_URL,
  DEFAULT_ENTITY_TTL_SECONDS,
  DEMO_AUTHORITY,
  DEMO_INTERPRETER,
} from "../src/lib/constants";
import { buildReflectionPrompt, hashReflectionPrompt } from "../src/lib/reflection";
import {
  agentReflectionAttributes,
  createAgentReflectionPayload,
  createModifierStackPayload,
  createMemoryNodePayload,
  memoryNodeAttributes,
  modifierStackAttributes,
} from "../src/lib/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const privateKey = process.env.ARKIV_PRIVATE_KEY ?? process.env.TEST_PRIVATE_KEY;

if (!privateKey) {
  console.error("ERROR: Set ARKIV_PRIVATE_KEY in .env.local to run the Braga demo seed script.");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: braga,
  transport: http(ARKIV_BRAGA_RPC_URL),
});

async function main() {
  console.log("Starting demo seeding on Braga network using wallet:", account.address);

  // Demo Memory 1: Recursive Decision Process
  console.log("\nCreating Memory 1: Recursive Decision Process...");
  const memory1Payload = createMemoryNodePayload({
    title: "Recursive Decision Process Pattern",
    content: "When confronted with complex logical puzzles or multi-layered inputs, hold contradictory interpretations in view without committing. Monitor external events, wait for a natural pattern to stabilize, and only then construct the final decision action.",
    contentMode: "plaintext",
    domain: "cognition-dynamics",
    visibility: "private",
  });
  const { entityKey: memory1Key, txHash: memory1Tx } = await walletClient.createEntity({
    payload: jsonToPayload(memory1Payload),
    contentType: "application/json",
    attributes: memoryNodeAttributes(memory1Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Memory 1 Node: ${memory1Key} (Tx: ${memory1Tx})`);

  console.log("Creating ModifierStack 1 for Memory 1...");
  const modifiers1 = ["expand:reasoning", "transform:concise-bullets"];
  const stack1Payload = createModifierStackPayload({
    memoryKey: memory1Key,
    modifiers: modifiers1,
    interpreter: DEMO_INTERPRETER,
    context: "Cognitive step-by-step logic expansion.",
    authority: DEMO_AUTHORITY,
  });
  const { entityKey: stack1Key, txHash: stack1Tx } = await walletClient.createEntity({
    payload: jsonToPayload(stack1Payload),
    contentType: "application/json",
    attributes: modifierStackAttributes(stack1Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created ModifierStack 1: ${stack1Key} (Tx: ${stack1Tx})`);

  console.log("Generating first recursive reflection for Memory 1...");
  const prompt1 = buildReflectionPrompt({
    memoryContent: memory1Payload.content!,
    modifiers: modifiers1,
    interpreter: DEMO_INTERPRETER,
    context: stack1Payload.context,
    authority: DEMO_AUTHORITY,
    priorReflections: [],
  });
  const reflection1Payload = createAgentReflectionPayload({
    memoryKey: memory1Key,
    modifierStackKey: stack1Key,
    reflection: "Model evaluation: Holding competing logic states avoids early local minima optimization, reducing overall agent error rate by 14%.",
    model: "llama-3.1-8b-instant",
    interpreter: DEMO_INTERPRETER,
    context: stack1Payload.context,
    authority: DEMO_AUTHORITY,
    promptHash: hashReflectionPrompt(prompt1),
    lineageDepth: 0,
  });
  const { entityKey: reflection1Key, txHash: reflection1Tx } = await walletClient.createEntity({
    payload: jsonToPayload(reflection1Payload),
    contentType: "application/json",
    attributes: agentReflectionAttributes(reflection1Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Reflection 1 (Depth 0): ${reflection1Key} (Tx: ${reflection1Tx})`);

  console.log("Generating second recursive reflection (child of Reflection 1) for Memory 1...");
  const prompt2 = buildReflectionPrompt({
    memoryContent: memory1Payload.content!,
    modifiers: modifiers1,
    interpreter: DEMO_INTERPRETER,
    context: stack1Payload.context,
    authority: DEMO_AUTHORITY,
    priorReflections: [reflection1Payload.reflection!],
  });
  const reflection2Payload = createAgentReflectionPayload({
    memoryKey: memory1Key,
    modifierStackKey: stack1Key,
    reflection: "Optimized decision workflow: Maintain contradiction state for exactly 3 feedback cycles. Group reasoning steps in secure thinking tags.",
    model: "llama-3.1-8b-instant",
    interpreter: DEMO_INTERPRETER,
    context: stack1Payload.context,
    authority: DEMO_AUTHORITY,
    promptHash: hashReflectionPrompt(prompt2),
    lineageDepth: 1,
    previousReflectionKey: reflection1Key,
  });
  const { entityKey: reflection2Key, txHash: reflection2Tx } = await walletClient.createEntity({
    payload: jsonToPayload(reflection2Payload),
    contentType: "application/json",
    attributes: agentReflectionAttributes(reflection2Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Reflection 2 (Depth 1, parent: Reflection 1): ${reflection2Key} (Tx: ${reflection2Tx})`);


  // Demo Memory 2: Security Compliance Log
  console.log("\nCreating Memory 2: Security compliance records...");
  const memory2Payload = createMemoryNodePayload({
    title: "Braga Security Compliance Audit",
    content: "Verify that all cryptographic wallets submit transactions under 500ms latency. Log any transaction hash that takes more than 1.2s to broadcast or clear on Braga.",
    contentMode: "plaintext",
    domain: "security-vault",
    visibility: "private",
  });
  const { entityKey: memory2Key, txHash: memory2Tx } = await walletClient.createEntity({
    payload: jsonToPayload(memory2Payload),
    contentType: "application/json",
    attributes: memoryNodeAttributes(memory2Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Memory 2 Node: ${memory2Key} (Tx: ${memory2Tx})`);

  console.log("Creating ModifierStack 2 for Memory 2...");
  const modifiers2 = ["route:secure-vault", "remember"];
  const stack2Payload = createModifierStackPayload({
    memoryKey: memory2Key,
    modifiers: modifiers2,
    interpreter: DEMO_INTERPRETER,
    context: "Audit latency metrics and compliance thresholds.",
    authority: DEMO_AUTHORITY,
  });
  const { entityKey: stack2Key, txHash: stack2Tx } = await walletClient.createEntity({
    payload: jsonToPayload(stack2Payload),
    contentType: "application/json",
    attributes: modifierStackAttributes(stack2Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created ModifierStack 2: ${stack2Key} (Tx: ${stack2Tx})`);

  console.log("Generating reflection for Memory 2...");
  const prompt3 = buildReflectionPrompt({
    memoryContent: memory2Payload.content!,
    modifiers: modifiers2,
    interpreter: DEMO_INTERPRETER,
    context: stack2Payload.context,
    authority: DEMO_AUTHORITY,
    priorReflections: [],
  });
  const reflection3Payload = createAgentReflectionPayload({
    memoryKey: memory2Key,
    modifierStackKey: stack2Key,
    reflection: "Security audit compliance report: Broadcast latencies checked. 99.8% of Braga vault write actions completed inside the 500ms window.",
    model: "llama-3.1-8b-instant",
    interpreter: DEMO_INTERPRETER,
    context: stack2Payload.context,
    authority: DEMO_AUTHORITY,
    promptHash: hashReflectionPrompt(prompt3),
    lineageDepth: 0,
  });
  const { entityKey: reflection3Key, txHash: reflection3Tx } = await walletClient.createEntity({
    payload: jsonToPayload(reflection3Payload),
    contentType: "application/json",
    attributes: agentReflectionAttributes(reflection3Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Reflection 3 (Depth 0): ${reflection3Key} (Tx: ${reflection3Tx})`);


  // Demo Memory 3: Autonomous Workflow Policy
  console.log("\nCreating Memory 3: Autonomous workflows...");
  const memory3Payload = createMemoryNodePayload({
    title: "Autonomous Agent Execution Rules",
    content: "When acting on behalf of a wallet, an agent must only execute read calls unless the transaction value is less than 0.05 ETH on Braga. Multi-step actions must be signed sequentially by the owner wallet.",
    contentMode: "plaintext",
    domain: "agent-architecture",
    visibility: "private",
  });
  const { entityKey: memory3Key, txHash: memory3Tx } = await walletClient.createEntity({
    payload: jsonToPayload(memory3Payload),
    contentType: "application/json",
    attributes: memoryNodeAttributes(memory3Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Memory 3 Node: ${memory3Key} (Tx: ${memory3Tx})`);

  console.log("Creating ModifierStack 3 for Memory 3...");
  const modifiers3 = ["expand:scientific-detail", "transform:dialogue"];
  const stack3Payload = createModifierStackPayload({
    memoryKey: memory3Key,
    modifiers: modifiers3,
    interpreter: DEMO_INTERPRETER,
    context: "Format limits and checks as a dialogue workflow.",
    authority: DEMO_AUTHORITY,
  });
  const { entityKey: stack3Key, txHash: stack3Tx } = await walletClient.createEntity({
    payload: jsonToPayload(stack3Payload),
    contentType: "application/json",
    attributes: modifierStackAttributes(stack3Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created ModifierStack 3: ${stack3Key} (Tx: ${stack3Tx})`);

  console.log("Generating reflection for Memory 3...");
  const prompt4 = buildReflectionPrompt({
    memoryContent: memory3Payload.content!,
    modifiers: modifiers3,
    interpreter: DEMO_INTERPRETER,
    context: stack3Payload.context,
    authority: DEMO_AUTHORITY,
    priorReflections: [],
  });
  const reflection4Payload = createAgentReflectionPayload({
    memoryKey: memory3Key,
    modifierStackKey: stack3Key,
    reflection: "Architectural confirmation: Dialoguing boundary rules has been parsed. The agent will strictly refuse higher value executions without explicit wallet signing signatures.",
    model: "llama-3.1-8b-instant",
    interpreter: DEMO_INTERPRETER,
    context: stack3Payload.context,
    authority: DEMO_AUTHORITY,
    promptHash: hashReflectionPrompt(prompt4),
    lineageDepth: 0,
  });
  const { entityKey: reflection4Key, txHash: reflection4Tx } = await walletClient.createEntity({
    payload: jsonToPayload(reflection4Payload),
    contentType: "application/json",
    attributes: agentReflectionAttributes(reflection4Payload),
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });
  console.log(`Created Reflection 4 (Depth 0): ${reflection4Key} (Tx: ${reflection4Tx})`);

  console.log("\nDemo seeding completed successfully! All entities saved to Arkiv Braga ledger.");
}

main().catch((error) => {
  console.error("Fatal error running Braga demo seed script:", error);
  process.exit(1);
});
