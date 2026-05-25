export const PROJECT_ATTRIBUTE = "semantic_atlas_v1";
export const SCHEMA_VERSION = "1";

export const APP_NAME = "SemanticAtlas";
export const APP_TAGLINE = "Own the way your AI remembers.";

export const ARKIV_BRAGA_CHAIN_ID = 60138453102;
export const ARKIV_BRAGA_RPC_URL =
  process.env.NEXT_PUBLIC_ARKIV_RPC_URL ??
  "https://braga.hoodi.arkiv.network/rpc";
export const ARKIV_BRAGA_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARKIV_EXPLORER_URL ??
  "https://explorer.braga.hoodi.arkiv.network";

export const DEFAULT_ENTITY_TTL_SECONDS =
  Number(process.env.NEXT_PUBLIC_ARKIV_EXPIRES_IN_SECONDS) ||
  60 * 60 * 24 * 30;

export const ARKIV_CREATE_GAS_LIMIT =
  BigInt(process.env.NEXT_PUBLIC_ARKIV_CREATE_GAS_LIMIT ?? "650000");
export const ARKIV_MIN_MAX_FEE_PER_GAS_WEI =
  BigInt(process.env.NEXT_PUBLIC_ARKIV_MIN_MAX_FEE_PER_GAS_WEI ?? "2000000");
export const ARKIV_GAS_FEE_MULTIPLIER =
  BigInt(process.env.NEXT_PUBLIC_ARKIV_GAS_FEE_MULTIPLIER ?? "3");

export const DEMO_MEMORY_CONTENT =
  "When I solve hard problems, I map contradictions first, then let a pattern emerge before choosing a direction.";

export const DEMO_MODIFIERS = [
  "expand:contradictions",
  "route:private-reasoning",
  "transform:pattern-map",
  "remember",
];

export const DEMO_MEMORY_TITLE = "Private Thinking Pattern";
export const DEMO_MEMORY_DOMAIN = "personal-cognition";
export const DEMO_INTERPRETER = "cognition-atlas:v2";
export const DEMO_CONTEXT =
  "Private reasoning pattern for future agents that need to understand how this user reaches decisions.";
export const DEMO_AUTHORITY = "wallet-owner";
