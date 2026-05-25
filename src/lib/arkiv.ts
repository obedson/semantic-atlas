import {
  createPublicClient,
  createWalletClient,
  jsonToPayload,
  type Entity,
} from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import {
  custom,
  createPublicClient as createViemPublicClient,
  http,
  isAddress,
  isHex,
  toHex,
  type Address,
  type Hex,
} from "viem";

import {
  ARKIV_BRAGA_CHAIN_ID,
  ARKIV_BRAGA_EXPLORER_URL,
  ARKIV_BRAGA_RPC_URL,
  ARKIV_CREATE_GAS_LIMIT,
  ARKIV_GAS_FEE_MULTIPLIER,
  ARKIV_MIN_MAX_FEE_PER_GAS_WEI,
  DEFAULT_ENTITY_TTL_SECONDS,
  PROJECT_ATTRIBUTE,
  SCHEMA_VERSION,
} from "./constants";
import {
  agentInsightAttributes,
  createAgentInsightPayload,
  createMemoryNodePayload,
  createMemoryContextPayload,
  isAgentInsightPayload,
  isMemoryNodePayload,
  isMemoryContextPayload,
  memoryNodeAttributes,
  memoryContextAttributes,
  modifierAttributeKey,
  normalizeModifier,
  type AgentInsightPayload,
  type ArkivEntityRecord,
  type CreateAgentInsightInput,
  type CreateMemoryInput,
  type CreateMemoryContextInput,
  type ContentMode,
  type MemoryNodePayload,
  type MemoryContextPayload,
  type SemanticAtlasPayload,
  type Visibility,
} from "./schema";

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
  removeListener?(
    event: "accountsChanged" | "chainChanged",
    listener: (...args: unknown[]) => void,
  ): void;
};

export type WalletConnection = {
  address: Address;
  chainId: number;
};

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: Eip1193Provider;
}

export type DiscoveredProvider = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: Eip1193Provider;
};

const publicClient = createPublicClient({
  chain: braga,
  transport: http(ARKIV_BRAGA_RPC_URL),
});

const viemPublicClient = createViemPublicClient({
  chain: braga,
  transport: http(ARKIV_BRAGA_RPC_URL),
});

const discoveredProviders: DiscoveredProvider[] = [];
const providerListeners = new Set<(providers: DiscoveredProvider[]) => void>();

export function getDiscoveredProviders(): DiscoveredProvider[] {
  return discoveredProviders;
}

export function watchDiscoveredProviders(onChange: (providers: DiscoveredProvider[]) => void) {
  providerListeners.add(onChange);
  onChange([...discoveredProviders]);
  return () => {
    providerListeners.delete(onChange);
  };
}

export function getLegacyProvider(): DiscoveredProvider | null {
  if (typeof window !== "undefined" && window.ethereum) {
    return {
      uuid: "legacy-injected",
      name: "Injected Browser Wallet",
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='5' width='20' height='14' rx='2' ry='2'/><line x1='2' y1='10' x2='22' y2='10'/></svg>",
      rdns: "window.ethereum",
      provider: window.ethereum as Eip1193Provider,
    };
  }
  return null;
}

let activeProviderUuid: string | null = null;
const walletListeners = new Set<(connection: WalletConnection | null) => void>();

if (typeof window !== "undefined") {
  activeProviderUuid = localStorage.getItem("arkiv_active_provider_uuid");
}

export function getActiveProviderUuid(): string | null {
  return activeProviderUuid;
}

export function setActiveProviderUuid(uuid: string | null) {
  activeProviderUuid = uuid;
  if (typeof window !== "undefined") {
    if (uuid) {
      localStorage.setItem("arkiv_active_provider_uuid", uuid);
    } else {
      localStorage.removeItem("arkiv_active_provider_uuid");
    }
  }
  setupProviderListeners();
  void notifyWalletListeners();
}

export function getActiveProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;

  if (activeProviderUuid) {
    const found = discoveredProviders.find((p) => p.uuid === activeProviderUuid);
    if (found) return found.provider;

    const legacy = getLegacyProvider();
    if (legacy && legacy.uuid === activeProviderUuid) return legacy.provider;
  }

  if (discoveredProviders.length > 0) {
    return discoveredProviders[0].provider;
  }

  const legacy = getLegacyProvider();
  if (legacy) return legacy.provider;

  return null;
}

export function getActiveProviderName(): string | null {
  if (typeof window === "undefined") return null;
  const provider = getActiveProvider();
  if (!provider) return null;

  if (activeProviderUuid) {
    const found = discoveredProviders.find((p) => p.uuid === activeProviderUuid);
    if (found) return found.name;

    const legacy = getLegacyProvider();
    if (legacy && legacy.uuid === activeProviderUuid) return legacy.name;
  }

  if (discoveredProviders.length > 0 && discoveredProviders[0].provider === provider) {
    return discoveredProviders[0].name;
  }

  const legacy = getLegacyProvider();
  if (legacy && legacy.provider === provider) {
    return legacy.name;
  }

  return "Injected Wallet";
}

function getProvider() {
  const provider = getActiveProvider();
  if (!provider) {
    throw new Error("No injected wallet found. Please install MetaMask, Rabby, Coinbase Wallet, Phantom, or another EIP-1193 wallet.");
  }
  return provider;
}

function toChainHex(chainId: number) {
  return toHex(chainId);
}

function getWalletErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? error.code : null;
}

function toWalletError(error: unknown, fallback: string) {
  const code = getWalletErrorCode(error);

  if (code === -32002) {
    return new Error("A request is already pending. Please open your wallet and approve the transaction, then retry.");
  }

  if (code === 4001) {
    return new Error("Wallet request rejected. Please reopen your wallet and approve the connection to continue.");
  }

  return error instanceof Error ? error : new Error(fallback);
}

async function ensureBragaChain(provider: Eip1193Provider) {
  const chainId = toChainHex(ARKIV_BRAGA_CHAIN_ID);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error) {
    const code = getWalletErrorCode(error);

    if (code !== 4902) {
      throw toWalletError(error, "Could not switch wallet to Arkiv Braga.");
    }

    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId,
            chainName: "Arkiv Braga",
            nativeCurrency: braga.nativeCurrency,
            rpcUrls: [ARKIV_BRAGA_RPC_URL],
            blockExplorerUrls: [ARKIV_BRAGA_EXPLORER_URL],
          },
        ],
      });
    } catch (addError) {
      throw toWalletError(addError, "Could not add Arkiv Braga to the wallet.");
    }
  }
}

async function getAccounts(provider: Eip1193Provider, requestAccess: boolean) {
  const method = requestAccess ? "eth_requestAccounts" : "eth_accounts";

  try {
    return (await provider.request({ method })) as Address[];
  } catch (error) {
    throw toWalletError(error, "Wallet account request failed.");
  }
}

export async function getConnectedWallet(): Promise<WalletConnection | null> {
  const provider = getActiveProvider();
  if (!provider) return null;

  try {
    const accounts = await getAccounts(provider, false);
    if (!accounts?.[0]) {
      return null;
    }

    const rawChainId = (await provider.request({ method: "eth_chainId" })) as string;

    return {
      address: accounts[0],
      chainId: Number.parseInt(rawChainId, 16),
    };
  } catch {
    return null;
  }
}

export async function connectWallet(providerUuid?: string): Promise<WalletConnection> {
  if (providerUuid) {
    setActiveProviderUuid(providerUuid);
  }

  const provider = getProvider();
  let accounts = await getAccounts(provider, false);

  if (!accounts?.[0]) {
    accounts = await getAccounts(provider, true);
  }

  if (!accounts?.[0]) {
    throw new Error("Wallet did not return an account.");
  }

  await ensureBragaChain(provider);
  const rawChainId = (await provider.request({ method: "eth_chainId" })) as string;

  setupProviderListeners();

  return {
    address: accounts[0],
    chainId: Number.parseInt(rawChainId, 16),
  };
}

export function disconnectWallet() {
  setActiveProviderUuid(null);
}

let currentSubscribedProvider: Eip1193Provider | null = null;

const handleAccountsChanged = () => {
  void notifyWalletListeners();
};
const handleChainChanged = () => {
  void notifyWalletListeners();
};

function setupProviderListeners() {
  const provider = getActiveProvider();
  if (currentSubscribedProvider === provider) return;

  if (currentSubscribedProvider) {
    try {
      currentSubscribedProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      currentSubscribedProvider.removeListener?.("chainChanged", handleChainChanged);
    } catch (e) {
      console.warn("Failed to remove provider listeners", e);
    }
  }

  currentSubscribedProvider = provider;

  if (provider) {
    try {
      provider.on?.("accountsChanged", handleAccountsChanged);
      provider.on?.("chainChanged", handleChainChanged);
    } catch (e) {
      console.warn("Failed to add provider listeners", e);
    }
  }
}

export function watchWalletConnection(onChange: (connection: WalletConnection | null) => void) {
  walletListeners.add(onChange);
  
  void getConnectedWallet()
    .then((conn) => {
      onChange(conn);
    })
    .catch(() => {
      onChange(null);
    });

  setupProviderListeners();

  return () => {
    walletListeners.delete(onChange);
  };
}

async function notifyWalletListeners() {
  const conn = await getConnectedWallet();
  for (const listener of walletListeners) {
    try {
      listener(conn);
    } catch (err) {
      console.error(err);
    }
  }
}

if (typeof window !== "undefined") {
  const announceListener = (event: Event) => {
    const e = event as CustomEvent<EIP6963ProviderDetail>;
    const detail = e.detail;
    if (!detail?.info || !detail?.provider) return;

    if (!discoveredProviders.some((p) => p.uuid === detail.info.uuid)) {
      discoveredProviders.push({
        uuid: detail.info.uuid,
        name: detail.info.name,
        icon: detail.info.icon,
        rdns: detail.info.rdns,
        provider: detail.provider,
      });
      discoveredProviders.sort((a, b) => a.name.localeCompare(b.name));

      for (const listener of providerListeners) {
        listener([...discoveredProviders]);
      }

      if (detail.info.uuid === activeProviderUuid) {
        setupProviderListeners();
        void notifyWalletListeners();
      }
    }
  };

  window.addEventListener("eip6963:announceProvider", announceListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

async function getWalletClient() {
  const provider = getProvider();
  const { address } = await connectWallet();
  const client = createWalletClient({
    account: address,
    chain: braga,
    transport: custom(provider),
  });

  // Some injected wallet providers keep receipt polling open after Braga confirms.
  // Sign with the wallet, but poll confirmations through the public Braga RPC.
  client.waitForTransactionReceipt = ((args) => {
    return viemPublicClient.waitForTransactionReceipt(args);
  }) as typeof client.waitForTransactionReceipt;

  return {
    address,
    client,
  };
}

function maxBigInt(...values: bigint[]) {
  return values.reduce((max, value) => (value > max ? value : max), values[0] ?? BigInt(0));
}

async function getSafeCreateTxParams(address: Address) {
  const [latestNonce, pendingNonce, balance, gasPrice] = await Promise.all([
    viemPublicClient.getTransactionCount({ address, blockTag: "latest" }),
    viemPublicClient.getTransactionCount({ address, blockTag: "pending" }),
    viemPublicClient.getBalance({ address }),
    viemPublicClient.getGasPrice(),
  ]);

  if (pendingNonce > latestNonce) {
    console.warn(
      `Pending Braga transactions detected: ${pendingNonce - latestNonce}. Proceeding with sequential nonce queueing via wallet.`
    );
  }

  const maxFeePerGas = maxBigInt(
    gasPrice * ARKIV_GAS_FEE_MULTIPLIER,
    ARKIV_MIN_MAX_FEE_PER_GAS_WEI,
  );
  const maxPriorityFeePerGas = maxBigInt(gasPrice / BigInt(10), BigInt(1000));
  const maxUpfrontGas = ARKIV_CREATE_GAS_LIMIT * maxFeePerGas;

  if (balance < maxUpfrontGas) {
    throw new Error(
      `This wallet has too little Braga GLM for a safe Arkiv write. Fund at least ${maxUpfrontGas.toString()} wei plus a small buffer, then retry.`,
    );
  }

  return {
    gas: ARKIV_CREATE_GAS_LIMIT,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}

function assertEntityKey(key: string): asserts key is Hex {
  if (!isHex(key, { strict: true })) {
    throw new Error("Arkiv entity keys must be strict 0x-prefixed hex strings.");
  }
}

function entityToRecord<T extends ModifierVaultPayload>(entity: Entity): ArkivEntityRecord<T> {
  const payload = entity.toJson() as T;

  return {
    key: entity.key,
    owner: entity.owner,
    creator: entity.creator,
    contentType: entity.contentType,
    createdAtBlock: entity.createdAtBlock,
    lastModifiedAtBlock: entity.lastModifiedAtBlock,
    attributes: entity.attributes,
    payload,
  };
}

export async function createMemoryNode(input: CreateMemoryInput) {
  const payload = createMemoryNodePayload(input);
  const { address, client } = await getWalletClient();
  const txParams = await getSafeCreateTxParams(address);

  const result = await client.createEntity({
    payload: jsonToPayload(payload),
    attributes: memoryNodeAttributes(payload),
    contentType: "application/json",
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  }, txParams);

  return {
    ...result,
    record: {
      key: result.entityKey,
      payload,
      attributes: memoryNodeAttributes(payload),
      txHash: result.txHash,
    } satisfies ArkivEntityRecord<MemoryNodePayload>,
  };
}

export async function createMemoryContext(input: CreateMemoryContextInput) {
  const payload = createMemoryContextPayload(input);
  const { address, client } = await getWalletClient();
  const txParams = await getSafeCreateTxParams(address);

  const result = await client.createEntity({
    payload: jsonToPayload(payload),
    attributes: memoryContextAttributes(payload),
    contentType: "application/json",
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  }, txParams);

  return {
    ...result,
    record: {
      key: result.entityKey,
      payload,
      attributes: memoryContextAttributes(payload),
      txHash: result.txHash,
    } satisfies ArkivEntityRecord<MemoryContextPayload>,
  };
}

export async function createAgentInsight(input: CreateAgentInsightInput) {
  const payload = createAgentInsightPayload(input);
  const { address, client } = await getWalletClient();
  const txParams = await getSafeCreateTxParams(address);

  const result = await client.createEntity({
    payload: jsonToPayload(payload),
    attributes: agentInsightAttributes(payload),
    contentType: "application/json",
    expiresIn: DEFAULT_ENTITY_TTL_SECONDS,
  }, txParams);

  return {
    ...result,
    record: {
      key: result.entityKey,
      payload,
      attributes: agentInsightAttributes(payload),
      txHash: result.txHash,
    } satisfies ArkivEntityRecord<AgentInsightPayload>,
  };
}

export async function readEntityByKey<T extends SemanticAtlasPayload>(key: string) {
  assertEntityKey(key);
  const entity = await publicClient.getEntity(key);
  return entityToRecord<T>(entity);
}

export async function readMemoryNode(key: string) {
  const record = await readEntityByKey<MemoryNodePayload>(key);

  if (!isMemoryNodePayload(record.payload)) {
    throw new Error("Entity exists on Arkiv, but it is not a SemanticAtlas MemoryNode.");
  }

  return record;
}

function applyOwnerFilters<T extends ReturnType<typeof publicClient.buildQuery>>(
  query: T,
  options: { owner?: string; creator?: string },
) {
  let nextQuery = query;

  if (options.owner && isAddress(options.owner)) {
    nextQuery = nextQuery.ownedBy(options.owner as Hex) as T;
  }

  if (options.creator && isAddress(options.creator)) {
    nextQuery = nextQuery.createdBy(options.creator as Hex) as T;
  }

  return nextQuery;
}

export type QueryMemoryNodeOptions = {
  domain?: string;
  contentMode?: ContentMode;
  visibility?: Visibility;
  owner?: string;
  creator?: string;
  includeLegacy?: boolean;
  limit?: number;
};

export async function queryMemoryNodes(options: QueryMemoryNodeOptions | number = {}) {
  const normalizedOptions = typeof options === "number" ? { limit: options } : options;
  const predicates = [
    eq("project", PROJECT_ATTRIBUTE),
    eq("entityType", "MemoryNode"),
  ];

  if (!normalizedOptions.includeLegacy) {
    predicates.push(eq("schemaVersion", SCHEMA_VERSION));
  }

  if (normalizedOptions.domain?.trim()) {
    predicates.push(eq("domain", normalizedOptions.domain.trim()));
  }

  if (normalizedOptions.contentMode) {
    predicates.push(eq("contentMode", normalizedOptions.contentMode));
  }

  if (normalizedOptions.visibility) {
    predicates.push(eq("visibility", normalizedOptions.visibility));
  }

  const query = applyOwnerFilters(
    publicClient
      .buildQuery()
      .where(predicates)
      .withPayload()
      .withAttributes()
      .withMetadata()
      .orderBy("createdAt", "string", "desc")
      .limit(normalizedOptions.limit ?? 25),
    normalizedOptions,
  );

  const result = await query.fetch();

  return result.entities
    .map((entity) => entityToRecord<MemoryNodePayload>(entity))
    .filter((record) => isMemoryNodePayload(record.payload));
}

export type QueryMemoryContextOptions = {
  memoryKey?: string;
  modifier?: string;
  interpreter?: string;
  authority?: string;
  includeLegacy?: boolean;
  limit?: number;
};

export async function queryMemoryContexts(options: QueryMemoryContextOptions = {}) {
  const predicates = [
    eq("project", PROJECT_ATTRIBUTE),
    eq("entityType", "MemoryContext"),
  ];

  if (!options.includeLegacy) {
    predicates.push(eq("schemaVersion", SCHEMA_VERSION));
  }

  if (options.memoryKey) {
    predicates.push(eq("memoryKey", options.memoryKey));
  }

  if (options.modifier) {
    predicates.push(eq(modifierAttributeKey(options.modifier), "true"));
  }

  if (options.interpreter?.trim()) {
    predicates.push(eq("interpreter", options.interpreter.trim()));
  }

  if (options.authority?.trim()) {
    predicates.push(eq("authority", options.authority.trim()));
  }

  const result = await publicClient
    .buildQuery()
    .where(predicates)
    .withPayload()
    .withAttributes()
    .withMetadata()
    .orderBy("createdAt", "string", "desc")
    .limit(options.limit ?? 25)
    .fetch();

  return result.entities
    .map((entity) => entityToRecord<MemoryContextPayload>(entity))
    .filter((record) => isMemoryContextPayload(record.payload));
}

export type QueryAgentInsightOptions = {
  memoryKey?: string;
  memoryContextKey?: string;
  interpreter?: string;
  previousInsightKey?: string;
  includeLegacy?: boolean;
  limit?: number;
};

export async function queryAgentInsights(options: QueryAgentInsightOptions = {}) {
  const predicates = [
    eq("project", PROJECT_ATTRIBUTE),
    eq("entityType", "AgentInsight"),
  ];

  if (!options.includeLegacy) {
    predicates.push(eq("schemaVersion", SCHEMA_VERSION));
  }

  if (options.memoryKey) {
    predicates.push(eq("memoryKey", options.memoryKey));
  }

  if (options.memoryContextKey) {
    predicates.push(eq("memoryContextKey", options.memoryContextKey));
  }

  if (options.interpreter?.trim()) {
    predicates.push(eq("interpreter", options.interpreter.trim()));
  }

  if (options.previousInsightKey) {
    predicates.push(eq("previousInsightKey", options.previousInsightKey));
  }

  const result = await publicClient
    .buildQuery()
    .where(predicates)
    .withPayload()
    .withAttributes()
    .withMetadata()
    .orderBy("createdAt", "string", "desc")
    .limit(options.limit ?? 25)
    .fetch();

  return result.entities
    .map((entity) => entityToRecord<AgentInsightPayload>(entity))
    .filter((record) => isAgentInsightPayload(record.payload));
}

export async function queryMemoryNodesByModifier(
  modifier: string,
  limit = 25,
  options: Omit<QueryMemoryContextOptions, "modifier" | "limit"> = {},
) {
  const normalized = normalizeModifier(modifier);
  const contexts = await queryMemoryContexts({ ...options, modifier: normalized, limit });
  const keys = Array.from(new Set(contexts.map((ctx) => ctx.payload.memoryKey)));
  const memories = await Promise.allSettled(keys.map((key) => readMemoryNode(key)));

  return {
    contexts,
    memories: memories
      .filter((result): result is PromiseFulfilledResult<ArkivEntityRecord<MemoryNodePayload>> => result.status === "fulfilled")
      .map((result) => result.value),
  };
}

export async function readMemoryGraph(memoryKey: string) {
  const memory = await readMemoryNode(memoryKey);
  const includeLegacy = memory.payload.schemaVersion !== SCHEMA_VERSION;
  const [contexts, insights] = await Promise.all([
    queryMemoryContexts({ memoryKey, includeLegacy }),
    queryAgentInsights({ memoryKey, includeLegacy }),
  ]);

  return { memory, contexts, insights };
}

export function arkivExplorerEntityUrl(key: string) {
  return `${ARKIV_BRAGA_EXPLORER_URL}/entity/${key}`;
}

export function arkivExplorerTxUrl(txHash: string) {
  return `${ARKIV_BRAGA_EXPLORER_URL}/tx/${txHash}`;
}

// Legacy function aliases for backward compatibility
export const createModifierStack = createMemoryContext;
export const createAgentReflection = createAgentInsight;
export const queryModifierStacks = queryMemoryContexts;
export const queryAgentReflections = queryAgentInsights;
