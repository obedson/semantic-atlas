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
  agentReflectionAttributes,
  createAgentReflectionPayload,
  createModifierStackPayload,
  createMemoryNodePayload,
  isAgentReflectionPayload,
  isMemoryNodePayload,
  isModifierStackPayload,
  memoryNodeAttributes,
  modifierAttributeKey,
  modifierStackAttributes,
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

  const stackPayload = createModifierStackPayload({
    memoryKey,
    modifiers: DEMO_MODIFIERS,
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
  });

  const { entityKey: modifierStackKey, txHash: modifierStackTxHash } =
    await walletClient.createEntity({
      payload: jsonToPayload(stackPayload),
      contentType: "application/json",
      attributes: modifierStackAttributes(stackPayload),
      expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
    });

  const stackEntity = await publicClient.getEntity(modifierStackKey);
  const storedStackPayload = stackEntity.toJson();

  if (!isModifierStackPayload(storedStackPayload)) {
    throw new Error("Braga readback payload did not match the ModifierStack schema.");
  }

  const reflectionPrompt = buildReflectionPrompt({
    memoryContent: DEMO_MEMORY_CONTENT,
    modifiers: DEMO_MODIFIERS,
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
    priorReflections: [],
  });
  const reflectionPayload = createAgentReflectionPayload({
    memoryKey,
    modifierStackKey,
    reflection:
      "The user's memory prefers contradiction mapping before commitment, so future agents should preserve ambiguity until a stable pattern appears.",
    model: "braga-smoke-local",
    interpreter: DEMO_INTERPRETER,
    context: DEMO_CONTEXT,
    authority: DEMO_AUTHORITY,
    promptHash: hashReflectionPrompt(reflectionPrompt),
    lineageDepth: 0,
  });

  const { entityKey: reflectionKey, txHash: reflectionTxHash } =
    await walletClient.createEntity({
      payload: jsonToPayload(reflectionPayload),
      contentType: "application/json",
      attributes: agentReflectionAttributes(reflectionPayload),
      expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
    });

  const reflectionEntity = await publicClient.getEntity(reflectionKey);
  const storedReflectionPayload = reflectionEntity.toJson();

  if (!isAgentReflectionPayload(storedReflectionPayload)) {
    throw new Error("Braga readback payload did not match the AgentReflection schema.");
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

  const foundCreatedStack = modifierQueryResult.entities.some((resultEntity) => {
    return resultEntity.key.toLowerCase() === modifierStackKey.toLowerCase();
  });

  if (!foundCreatedStack) {
    throw new Error("Braga modifier query did not return the ModifierStack just created.");
  }

  const reflectionQueryResult = await publicClient
    .buildQuery()
    .where([
      eq("project", PROJECT_ATTRIBUTE),
      eq("schemaVersion", SCHEMA_VERSION),
      eq("entityType", "AgentReflection"),
      eq("memoryKey", memoryKey),
      eq("modifierStackKey", modifierStackKey),
      eq("interpreter", DEMO_INTERPRETER),
    ])
    .withPayload()
    .withAttributes()
    .withMetadata()
    .limit(10)
    .fetch();

  const foundCreatedReflection = reflectionQueryResult.entities.some((resultEntity) => {
    return resultEntity.key.toLowerCase() === reflectionKey.toLowerCase();
  });

  if (!foundCreatedReflection) {
    throw new Error("Braga reflection query did not return the AgentReflection just created.");
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
        modifierStackKey,
        modifierStackTxHash,
        reflectionKey,
        reflectionTxHash,
        modifierQuery: "route:private-reasoning",
        queriedMemories: memoryQueryResult.entities.length,
        queriedModifierStacks: modifierQueryResult.entities.length,
        queriedReflections: reflectionQueryResult.entities.length,
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
