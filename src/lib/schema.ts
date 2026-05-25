import type { Attribute } from "@arkiv-network/sdk";

import {
  DEMO_AUTHORITY,
  DEMO_CONTEXT,
  DEMO_INTERPRETER,
  DEMO_MODIFIERS,
  PROJECT_ATTRIBUTE,
  SCHEMA_VERSION,
} from "./constants";
import type { EncryptedPayloadEnvelope } from "./crypto";

export type EntityType = "MemoryNode" | "MemoryContext" | "AgentInsight";
export type Visibility = "private" | "shared" | "public";
export type ContentMode = "plaintext" | "metadata-only" | "encrypted";

export type MemoryNodePayload = {
  entityType: "MemoryNode";
  project: typeof PROJECT_ATTRIBUTE;
  schemaVersion?: typeof SCHEMA_VERSION;
  title: string;
  content?: string;
  encryptedContent?: EncryptedPayloadEnvelope;
  contentPreview?: string;
  contentMode?: ContentMode;
  domain: string;
  visibility: Visibility;
  createdAt: string;
};

export type MemoryContextPayload = {
  entityType: "MemoryContext";
  project: typeof PROJECT_ATTRIBUTE;
  schemaVersion?: typeof SCHEMA_VERSION;
  memoryKey: string;
  modifiers: string[];
  interpreter: string;
  context: string;
  authority: string;
  createdAt: string;
};

export type AgentInsightPayload = {
  entityType: "AgentInsight";
  project: typeof PROJECT_ATTRIBUTE;
  schemaVersion?: typeof SCHEMA_VERSION;
  memoryKey: string;
  memoryContextKey: string;
  insight?: string;
  encryptedInsight?: EncryptedPayloadEnvelope;
  contentMode?: ContentMode;
  model: string;
  interpreter?: string;
  context?: string;
  authority?: string;
  previousInsightKey?: string;
  lineageDepth?: number;
  promptHash?: string;
  createdAt: string;
};

export type SemanticAtlasPayload =
  | MemoryNodePayload
  | MemoryContextPayload
  | AgentInsightPayload;

// Legacy type aliases for backward compatibility
export type ModifierStackPayload = MemoryContextPayload;
export type AgentReflectionPayload = AgentInsightPayload;
export type ModifierVaultPayload = SemanticAtlasPayload;

export type ArkivEntityRecord<T extends SemanticAtlasPayload = SemanticAtlasPayload> = {
  key: string;
  owner?: string;
  creator?: string;
  contentType?: string;
  createdAtBlock?: bigint;
  lastModifiedAtBlock?: bigint;
  attributes: Attribute[];
  payload: T;
  txHash?: string;
};

export type CreateMemoryInput = {
  title: string;
  content: string;
  domain: string;
  visibility: Visibility;
  contentMode?: ContentMode;
  encryptedContent?: EncryptedPayloadEnvelope;
  contentPreview?: string;
};

export type CreateMemoryContextInput = {
  memoryKey: string;
  modifiers: string[];
  interpreter: string;
  context: string;
  authority: string;
};

export type CreateAgentInsightInput = {
  memoryKey: string;
  memoryContextKey: string;
  insight: string;
  model: string;
  interpreter?: string;
  context?: string;
  authority?: string;
  contentMode?: ContentMode;
  encryptedInsight?: EncryptedPayloadEnvelope;
  previousInsightKey?: string;
  lineageDepth?: number;
  promptHash?: string;
};

// Legacy type aliases
export type CreateModifierStackInput = CreateMemoryContextInput;
export type CreateAgentReflectionInput = CreateAgentInsightInput;

export function normalizeModifier(modifier: string) {
  return modifier.trim().replace(/\s+/g, "-").toLowerCase();
}

export function parseModifierInput(value: string) {
  const parsed = value
    .split(/[\n,]+/)
    .map(normalizeModifier)
    .filter(Boolean);

  return Array.from(new Set(parsed));
}

export function modifierAttributeKey(modifier: string) {
  return `modifier__${normalizeModifier(modifier).replace(/[^a-z0-9_]/g, "_")}`;
}

export function createMemoryNodePayload(input: CreateMemoryInput): MemoryNodePayload {
  const contentMode = input.contentMode ?? "plaintext";
  const content = input.content.trim();
  const contentPreview =
    input.contentPreview?.trim() ||
    (content ? `${content.slice(0, 96)}${content.length > 96 ? "..." : ""}` : "Private memory");

  return {
    entityType: "MemoryNode",
    project: PROJECT_ATTRIBUTE,
    schemaVersion: SCHEMA_VERSION,
    title: input.title.trim() || "Untitled MemoryNode",
    ...(contentMode === "plaintext" ? { content } : {}),
    ...(contentMode === "encrypted" && input.encryptedContent
      ? { encryptedContent: input.encryptedContent }
      : {}),
    contentPreview,
    contentMode,
    domain: input.domain.trim() || "personal-cognition",
    visibility: input.visibility,
    createdAt: new Date().toISOString(),
  };
}

export function createMemoryContextPayload(
  input: CreateMemoryContextInput,
): MemoryContextPayload {
  const modifiers = input.modifiers.length ? input.modifiers : DEMO_MODIFIERS;

  return {
    entityType: "MemoryContext",
    project: PROJECT_ATTRIBUTE,
    schemaVersion: SCHEMA_VERSION,
    memoryKey: input.memoryKey,
    modifiers: modifiers.map(normalizeModifier),
    interpreter: input.interpreter.trim() || DEMO_INTERPRETER,
    context: input.context.trim() || DEMO_CONTEXT,
    authority: input.authority.trim() || DEMO_AUTHORITY,
    createdAt: new Date().toISOString(),
  };
}

export function createAgentInsightPayload(
  input: CreateAgentInsightInput,
): AgentInsightPayload {
  const contentMode = input.contentMode ?? "plaintext";
  const insight = input.insight.trim();

  return {
    entityType: "AgentInsight",
    project: PROJECT_ATTRIBUTE,
    schemaVersion: SCHEMA_VERSION,
    memoryKey: input.memoryKey,
    memoryContextKey: input.memoryContextKey,
    ...(contentMode === "plaintext" ? { insight } : {}),
    ...(contentMode === "encrypted" && input.encryptedInsight
      ? { encryptedInsight: input.encryptedInsight }
      : {}),
    contentMode,
    model: input.model.trim() || "groq",
    interpreter: input.interpreter?.trim() || DEMO_INTERPRETER,
    context: input.context?.trim() || DEMO_CONTEXT,
    authority: input.authority?.trim() || DEMO_AUTHORITY,
    previousInsightKey: input.previousInsightKey,
    lineageDepth: input.lineageDepth ?? 0,
    promptHash: input.promptHash,
    createdAt: new Date().toISOString(),
  };
}

function baseAttributes(payload: SemanticAtlasPayload): Attribute[] {
  return [
    { key: "project", value: PROJECT_ATTRIBUTE },
    { key: "schemaVersion", value: payload.schemaVersion ?? "1" },
    { key: "entityType", value: payload.entityType },
    { key: "createdAt", value: payload.createdAt },
  ];
}

export function memoryNodeAttributes(payload: MemoryNodePayload): Attribute[] {
  return [
    ...baseAttributes(payload),
    { key: "domain", value: payload.domain },
    { key: "visibility", value: payload.visibility },
    { key: "contentMode", value: payload.contentMode ?? "plaintext" },
    { key: "title", value: payload.title },
    { key: "titlePreview", value: payload.title },
  ];
}

export function memoryContextAttributes(payload: MemoryContextPayload): Attribute[] {
  return [
    ...baseAttributes(payload),
    { key: "memoryKey", value: payload.memoryKey },
    { key: "interpreter", value: payload.interpreter },
    { key: "authority", value: payload.authority },
    { key: "modifierList", value: payload.modifiers.join(",") },
    ...payload.modifiers.map((modifier) => ({
      key: modifierAttributeKey(modifier),
      value: "true",
    })),
  ];
}

export function agentInsightAttributes(payload: AgentInsightPayload): Attribute[] {
  return [
    ...baseAttributes(payload),
    { key: "memoryKey", value: payload.memoryKey },
    { key: "memoryContextKey", value: payload.memoryContextKey },
    { key: "model", value: payload.model },
    { key: "interpreter", value: payload.interpreter ?? DEMO_INTERPRETER },
    { key: "authority", value: payload.authority ?? DEMO_AUTHORITY },
    { key: "contentMode", value: payload.contentMode ?? "plaintext" },
    { key: "lineageDepth", value: payload.lineageDepth ?? 0 },
    ...(payload.previousInsightKey
      ? [{ key: "previousInsightKey", value: payload.previousInsightKey }]
      : []),
  ];
}

export function getMemoryContentMode(payload: MemoryNodePayload) {
  return payload.contentMode ?? "plaintext";
}

export function getMemoryDisplayContent(payload: MemoryNodePayload) {
  if (payload.contentMode === "encrypted") {
    return payload.contentPreview ?? "Encrypted memory. Decrypt locally to view.";
  }

  if (payload.contentMode === "metadata-only") {
    return payload.contentPreview ?? "Metadata-only memory. Private content was not stored.";
  }

  return payload.content ?? payload.contentPreview ?? "";
}

export function getInsightDisplayText(payload: AgentInsightPayload) {
  if (payload.contentMode === "encrypted") {
    return "Encrypted insight. Decrypt locally to view the interpretation artifact.";
  }

  if (payload.contentMode === "metadata-only") {
    return "Metadata-only insight. Private interpretation was not stored.";
  }

  return payload.insight ?? "";
}

export function isV2Payload(payload: SemanticAtlasPayload | unknown) {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "schemaVersion" in payload &&
    payload.schemaVersion === SCHEMA_VERSION
  );
}

export function isMemoryNodePayload(
  payload: SemanticAtlasPayload | unknown,
): payload is MemoryNodePayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "entityType" in payload &&
    payload.entityType === "MemoryNode" &&
    "project" in payload &&
    payload.project === PROJECT_ATTRIBUTE
  );
}

export function isMemoryContextPayload(
  payload: SemanticAtlasPayload | unknown,
): payload is MemoryContextPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "entityType" in payload &&
    payload.entityType === "MemoryContext" &&
    "project" in payload &&
    payload.project === PROJECT_ATTRIBUTE
  );
}

export function isAgentInsightPayload(
  payload: SemanticAtlasPayload | unknown,
): payload is AgentInsightPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "entityType" in payload &&
    payload.entityType === "AgentInsight" &&
    "project" in payload &&
    payload.project === PROJECT_ATTRIBUTE
  );
}

// Legacy function aliases
export const getReflectionDisplayText = getInsightDisplayText;
export const isModifierStackPayload = isMemoryContextPayload;
export const isAgentReflectionPayload = isAgentInsightPayload;
export const agentReflectionAttributes = agentInsightAttributes;
export const modifierStackAttributes = memoryContextAttributes;
export const createAgentReflectionPayload = createAgentInsightPayload;
export const createModifierStackPayload = createMemoryContextPayload;
