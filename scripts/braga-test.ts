import { createPublicClient, createWalletClient, jsonToPayload } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { config } from "dotenv";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  ARKIV_BRAGA_RPC_URL,
  DEFAULT_ENTITY_TTL_SECONDS,
  DEMO_AUTHORITY,
  DEMO_CONTEXT,
  DEMO_INTERPRETER,
  DEMO_MEMORY_CONTENT,
  DEMO_MEMORY_DOMAIN,
  DEMO_MEMORY_TITLE,
  DEMO_MODIFIERS,
  PROJECT_ATTRIBUTE,
  SCHEMA_VERSION,
} from "../src/lib/constants";
import { buildReflectionPrompt, hashReflectionPrompt } from "../src/lib/reflection";
import {
  agentInsightAttributes,
  createAgentInsightPayload,
  createMemoryContextPayload,
  createMemoryNodePayload,
  isAgentInsightPayload,
  isMemoryNodePayload,
  isMemoryContextPayload,
  memoryNodeAttributes,
  modifierAttributeKey,
  memoryContextAttributes,
} from "../src/lib/schema";

config({ path: ".env.local" });
config({ path: ".env" });

const privateKey = process.env.ARKIV_PRIVATE_KEY ?? process.env.TEST_PRIVATE_KEY;

if (!privateKey) {
  throw new Error(
    "Set ARKIV_PRIVATE_KEY in .env.local to run the Braga write/read/query smoke test.",
  );
}

const account = privateKeyToAccount(privateKey as `0x${string}`);

const publicClient = createPublicClient({
  chain: braga,
  transport: http(ARKIV_BRAGA_RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: braga,
  transport: http(ARKIV_BRAGA_RPC_URL),
});

async function main() {
  const payload = createMemoryNodePayload({
    title: `${DEMO_MEMORY_TITLE} smoke ${new Date().toISOString()}`,
    content: DEMO_MEMORY_CONTENT,
    contentMode: "plaintext",
    domain: DEMO_MEMORY_DOMAIN,
    visibility: "private",
  });

  const memoryAttributes = memoryNodeAttributes(payload);
  const { entityKey: memoryKey, txHash: memoryTxHash } = await walletClient.createEntity({
    payload: jsonToPayload(payload),
    contentType: "application/json",
    attributes: memoryAttributes,
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  });

  const memoryEntity = await publicClient.getEntity(memoryKey);
  const storedPayload = memoryEntity.toJson();

  if (!isMemoryNodePayload(storedPayload)) {
    throw new Error("Braga readback payload did not match the MemoryNode schema.");
  }

  const contextPayload = createMemoryContextPayload({
    memoryKey,
    modifiers: DEMO_MODIFIERS,
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
  });

  const { entityKey: memoryContextKey, txHash: memoryContextTxHash } =
    await walletClient.createEntity({
      payload: jsonToPayload(contextPayload),
      contentType: "application/json",
      attributes: memoryContextAttributes(contextPayload),
      expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
    });

  const contextEntity = await publicClient.getEntity(memoryContextKey);
  const storedContextPayload = contextEntity.toJson();

  if (!isMemoryContextPayload(storedContextPayload)) {
    throw new Error("Braga readback payload did not match the MemoryContext schema.");
  }

  const reflectionPrompt = buildReflectionPrompt({
    memoryContent: DEMO_MEMORY_CONTENT,
    modifiers: DEMO_MODIFIERS,
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
    priorReflections: [],
  });
  const insightPayload = createAgentInsightPayload({
    memoryKey,
    memoryContextKey,
    insight:
      "The user's memory prefers contradiction mapping before commitment, so future agents should preserve ambiguity until a stable pattern appears.",
    model: "braga-smoke-local",
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
    promptHash: hashReflectionPrompt(reflectionPrompt),
    lineageDepth: 0,
  });

  const { entityKey: insightKey, txHash: insightTxHash } =
    await walletClient.createEntity({
      payload: jsonToPayload(insightPayload),
      contentType: "application/json",
      attributes: agentInsightAttributes(insightPayload),
      expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
    });

  const insightEntity = await publicClient.getEntity(insightKey);
  const storedInsightPayload = insightEntity.toJson();

  if (!isAgentInsightPayload(storedInsightPayload)) {
    throw new Error("Braga readback payload did not match the AgentInsight schema.");
  }

  const memoryQueryResult = await publicClient
    .buildQuery()
    .where([
      eq("project", PROJECT_ATTRIBUTE),
      eq("schemaVersion", SCHEMA_VERSION),
      eq("entityType", "MemoryNode"),
      eq("domain", DEMO_MEMORY_DOMAIN),
    ])
    .withPayload()
    .withAttributes()
    .withMetadata()
    .limit(5)
    .fetch();

  const foundCreatedMemory = memoryQueryResult.entities.some((resultEntity) => {
    return resultEntity.key.toLowerCase() === memoryKey.toLowerCase();
  });

  if (!foundCreatedMemory) {
    throw new Error("Braga project query did not return the MemoryNode just created.");
  }

  const modifierQueryResult = await publicClient
    .buildQuery()
    .where([
      eq("project", PROJECT_ATTRIBUTE),
      eq("schemaVersion", SCHEMA_VERSION),
      eq("entityType", "ModifierStack"),
      eq("interpreter", DEMO_INTERPRETER),
      eq(modifierAttributeKey("route:private-reasoning"), "true"),
    ])
    .withPayload()
    .withAttributes()
    .withMetadata()
    .limit(10)
    .fetch();

  const foundCreatedContext = modifierQueryResult.entities.some((resultEntity) => {
    return resultEntity.key.toLowerCase() === memoryContextKey.toLowerCase();
  });

  if (!foundCreatedContext) {
    throw new Error("Braga modifier query did not return the MemoryContext just created.");
  }

  const insightQueryResult = await publicClient
    .buildQuery()
    .where([
      eq("project", PROJECT_ATTRIBUTE),
      eq("schemaVersion", SCHEMA_VERSION),
      eq("entityType", "AgentInsight"),
      eq("memoryKey", memoryKey),
      eq("memoryContextKey", memoryContextKey),
      eq("interpreter", DEMO_INTERPRETER),
    ])
    .withPayload()
    .withAttributes()
    .withMetadata()
    .limit(10)
    .fetch();

  const foundCreatedInsight = insightQueryResult.entities.some((resultEntity) => {
    return resultEntity.key.toLowerCase() === insightKey.toLowerCase();
  });

  if (!foundCreatedInsight) {
    throw new Error("Braga insight query did not return the AgentInsight just created.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        project: PROJECT_ATTRIBUTE,
        owner: memoryEntity.owner,
        creator: memoryEntity.creator,
        memoryKey,
        memoryTxHash,
        memoryContextKey,
        memoryContextTxHash,
        insightKey,
        insightTxHash,
        modifierQuery: "route:private-reasoning",
        queriedMemories: memoryQueryResult.entities.length,
        queriedMemoryContexts: modifierQueryResult.entities.length,
        queriedInsights: insightQueryResult.entities.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
