"use client";

import { 
  Loader2, 
  RefreshCw, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  LockKeyhole,
  WandSparkles,
  Download,
  CornerDownRight,
  Plus
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { 
  readMemoryGraph, 
  createAgentInsight, 
  createMemoryContext,
  arkivExplorerEntityUrl,
} from "@/lib/arkiv";
import { DEMO_AUTHORITY, DEMO_CONTEXT, DEMO_INTERPRETER, DEMO_MODIFIERS } from "@/lib/constants";
import { decryptString, encryptString } from "@/lib/crypto";
import { truncateMiddle } from "@/lib/format";
import type {
  AgentInsightPayload,
  ArkivEntityRecord,
  ContentMode,
  MemoryNodePayload,
  MemoryContextPayload,
} from "@/lib/schema";
import { getMemoryContentMode, getMemoryDisplayContent, getInsightDisplayText } from "@/lib/schema";
import { useWallet } from "@/hooks/useWallet";

import { EntityMeta } from "./EntityMeta";
import { MemoryGraph } from "./MemoryGraph";
import { ModifierToken } from "./ModifierToken";

// Caching & Prompt Debugger
import { useSecurity } from "@/context/SecurityContext";
import { buildReflectionPrompt } from "@/lib/prompt-utils";

type GraphState = {
  memory: ArkivEntityRecord<MemoryNodePayload>;
  contexts: ArkivEntityRecord<MemoryContextPayload>[];
  insights: ArkivEntityRecord<AgentInsightPayload>[];
};

const REFLECTION_PERSONAS = [
  {
    id: "custom",
    name: "✍️ Write Your Own Memory",
    text: "",
  },
  {
    id: "cognition",
    name: "📖 Storyteller Mode",
    text: "This memory shows a thoughtful decision-making style: taking time to see all sides of a situation before carefully choosing a path forward.",
  },
  {
    id: "optimizer",
    name: "💡 Practical Companion",
    text: "We successfully processed this memory, making sure the AI understands the core ideas clearly and is ready to help you with it.",
  },
  {
    id: "security",
    name: "🛡️ Friendly Guardian",
    text: "All checks complete! Your memory is safely stored and locked, keeping it fully protected and secure.",
  },
];

const MODIFIER_DESCRIPTIONS: Record<string, string> = {
  "expand:": "Adds helpful context and details to help your AI understand the bigger picture.",
  "route:": "Guides how your AI processes and saves this memory safely.",
  "transform:": "Changes how the memory sounds (its style, tone, or personality).",
  "remember": "Helps your AI remember these details for longer conversations."
};

function getModifierDescription(modifier: string): string {
  const clean = modifier.toLowerCase().trim();
  if (clean.startsWith("remember")) {
    return MODIFIER_DESCRIPTIONS["remember"];
  }
  for (const prefix of ["expand:", "route:", "transform:"]) {
    if (clean.startsWith(prefix)) {
      return MODIFIER_DESCRIPTIONS[prefix] + ` (Sub-behavior: ${modifier.slice(prefix.length)})`;
    }
  }
  return "Applies a special filter to change how the AI thinks.";
}

export function MemoryExperience() {
  const params = useParams<{ key: string }>();
  const memoryKey = useMemo(() => decodeURIComponent(params.key ?? ""), [params.key]);
  const [graph, setGraph] = useState<GraphState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Security passphrase cache integration
  const { getPassphrase, setPassphrase } = useSecurity();

  // Agent insight form states
  const [insightText, setInsightText] = useState("");
  const [selectedModel, setSelectedModel] = useState("groq");
  const [selectedPersona, setSelectedPersona] = useState("custom");
  const [selectedContextKey, setSelectedContextKey] = useState("");
  const [replyToKey, setReplyToKey] = useState<string | undefined>();
  const [decryptedMemory, setDecryptedMemory] = useState("");
  const [decryptedInsights, setDecryptedInsights] = useState<Record<string, string>>({});
  const [insightUnlockPassphrases, setInsightUnlockPassphrases] = useState<Record<string, string>>({});
  const [insightUnlockErrors, setInsightUnlockErrors] = useState<Record<string, string>>({});

  const decryptAllInsights = useCallback(
    async (insights: ArkivEntityRecord<AgentInsightPayload>[], passphrase: string) => {
      if (!passphrase.trim()) return;
      const nextDecrypted: Record<string, string> = {};
      for (const insight of insights) {
        if (
          insight.payload.contentMode === "encrypted" &&
          insight.payload.encryptedInsight
        ) {
          try {
            const decrypted = await decryptString(insight.payload.encryptedInsight, passphrase);
            nextDecrypted[insight.key] = decrypted;
          } catch {
            // maybe different passphrase, ignore
          }
        }
      }
      if (Object.keys(nextDecrypted).length > 0) {
        setDecryptedInsights((prev) => ({ ...prev, ...nextDecrypted }));
      }
    },
    []
  );
  const [decryptPassphrase, setDecryptPassphrase] = useState("");
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [promptHash, setPromptHash] = useState<string | undefined>();
  const [generatedModel, setGeneratedModel] = useState("groq");
  const [encryptInsight, setEncryptInsight] = useState(false);
  const [insightPassphrase, setInsightPassphrase] = useState("");
  const [isSubmittingInsight, setIsSubmittingInsight] = useState(false);
  const [isCreatingContext, setIsCreatingContext] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [insightSuccess, setInsightSuccess] = useState(false);
  const wallet = useWallet();

  // Prompt sandboxing
  const [customPromptText, setCustomPromptText] = useState("");
  const [showPromptDebugger, setShowPromptDebugger] = useState(false);

  // Live transaction progress tracking
  const [txStep, setTxStep] = useState<"idle" | "payload" | "wallet" | "broadcasting">("idle");

  const effectiveSelectedContextKey = selectedContextKey || graph?.contexts[0]?.key || "";
  const selectedContext = graph?.contexts.find((ctx) => ctx.key === effectiveSelectedContextKey);
  const memoryContentMode = graph ? getMemoryContentMode(graph.memory.payload) : "plaintext";
  const memoryForAi =
    memoryContentMode === "encrypted"
      ? decryptedMemory
      : graph
        ? getMemoryDisplayContent(graph.memory.payload)
        : "";

  // Dynamic Prompt generation
  const defaultPrompt = useMemo(() => {
    if (!graph || !selectedContext) return "";
    return buildReflectionPrompt({
      memoryContent: memoryForAi,
      modifiers: selectedContext.payload.modifiers,
      interpreter: selectedContext.payload.interpreter,
      context: selectedContext.payload.context,
      authority: selectedContext.payload.authority,
      priorReflections: graph.insights
        .map((i) => getInsightDisplayText(i.payload))
        .filter((i) => !i.startsWith("Encrypted"))
        .slice(0, 5),
    });
  }, [graph, selectedContext, memoryForAi]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setCustomPromptText(defaultPrompt);
    });
  }, [defaultPrompt]);

  // Session Passphrase Caching Hook
  useEffect(() => {
    if (memoryKey && graph?.memory.payload.encryptedContent && !decryptedMemory && !isDecrypting) {
      const cached = getPassphrase(memoryKey);
      if (cached) {
        Promise.resolve().then(() => {
          setDecryptPassphrase(cached);
          setIsDecrypting(true);
        });
        decryptString(graph.memory.payload.encryptedContent, cached)
          .then((decrypted) => {
            setDecryptedMemory(decrypted);
            setEncryptReflection(true);
            setReflectionPassphrase(cached);
            void decryptAllReflections(graph.insights, cached);
          })
          .catch(() => {
            // cached key invalid or expired
          })
          .finally(() => {
            setIsDecrypting(false);
          });
      }
    }
  }, [memoryKey, graph, getPassphrase, decryptedMemory, isDecrypting, decryptAllReflections]);

  // Auto-decrypt reflections when graph changes
  useEffect(() => {
    if (graph?.reflections) {
      const activePassphrase = decryptPassphrase || getPassphrase(memoryKey) || "";
      if (activePassphrase) {
        Promise.resolve().then(() => {
          void decryptAllReflections(graph.insights, activePassphrase);
        });
      }
    }
  }, [graph?.reflections, decryptPassphrase, memoryKey, getPassphrase, decryptAllReflections]);

  useEffect(() => {
    let isMounted = true;

    void getConnectedWallet()
      .then((existingConnection) => {
        if (isMounted) {
          setWallet(existingConnection);
        }
      })
      .catch(() => {
        if (isMounted) {
          setWallet(null);
        }
      });

    let unwatch: (() => void) | undefined;
    try {
      unwatch = watchWalletConnection((nextConnection) => {
        if (isMounted) {
          setWallet(nextConnection);
        }
      });
    } catch {
      unwatch = undefined;
    }

    const unwatchProviders = watchDiscoveredProviders((nextProviders) => {
      if (isMounted) {
        setProviders(nextProviders);
      }
    });

    return () => {
      isMounted = false;
      unwatch?.();
      unwatchProviders();
    };
  }, []);

  const loadGraph = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const nextGraph = await readMemoryGraph(memoryKey);
      setGraph(nextGraph);
      return nextGraph;
    } catch (caught) {
      if (!options?.silent) {
        setError(caught instanceof Error ? caught.message : "Could not load memory map.");
        setGraph(null);
      }
      return null;
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [memoryKey]);

  useEffect(() => {
    let isActive = true;

    async function loadInitialGraph() {
      setIsLoading(true);
      setError(null);

      try {
        const nextGraph = await readMemoryGraph(memoryKey);

        if (isActive) {
          setGraph(nextGraph);
        }
      } catch (caught) {
        if (isActive) {
          setError(caught instanceof Error ? caught.message : "Could not load memory map.");
          setGraph(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialGraph();

    return () => {
      isActive = false;
    };
  }, [memoryKey]);

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersona(personaId);
    const persona = REFLECTION_PERSONAS.find((p) => p.id === personaId);
    if (persona && personaId !== "custom") {
      setReflectionText(persona.text);
    } else if (personaId === "custom") {
      setReflectionText("");
    }
  };

  const availableProviders = () => {
    const legacy = getLegacyProvider();
    const allProviders = [...providers];
    if (legacy && !providers.some((p) => p.rdns === legacy.rdns || p.name === legacy.name)) {
      allProviders.push(legacy);
    }
    return allProviders;
  };

  const handleConnectProvider = async (providerUuid: string) => {
    setInsightError(null);
    setStackError(null);

    try {
      await connectWallet(providerUuid);
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "Could not connect your wallet.");
    }
  };

  const handleCreateDefaultStack = async () => {
    if (!graph) return;
    setIsCreatingStack(true);
    setStackError(null);

    try {
      const { record: createdContext } = await createMemoryContext({
        memoryKey,
        modifiers: DEMO_MODIFIERS,
        interpreter: DEMO_INTERPRETER,
        context: DEMO_CONTEXT,
        authority: DEMO_AUTHORITY,
      });

      if (createdContext) {
        setGraph((current) => {
          if (!current) return null;
          if (current.stacks.some((s) => s.key === createdContext.key)) {
            return current;
          }

          return {
            ...current,
            stacks: [createdContext, ...current.stacks],
          };
        });
      }
    } catch (err) {
      setStackError(err instanceof Error ? err.message : "Could not set up a lens for this memory.");
    } finally {
      setIsCreatingStack(false);
    }
  };

  const handleDecryptMemory = async () => {
    if (!graph?.memory.payload.encryptedContent) return;
    setIsDecrypting(true);
    setDecryptError(null);

    try {
      const decrypted = await decryptString(graph.memory.payload.encryptedContent, decryptPassphrase);
      setDecryptedMemory(decrypted);
      setEncryptReflection(true);
      if (!insightPassphrase) {
        setReflectionPassphrase(decryptPassphrase);
      }
      setPassphrase(memoryKey, decryptPassphrase);
      void decryptAllReflections(graph.insights, decryptPassphrase);
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : "Could not unlock memory. Please check your secret key.");
      setDecryptedMemory("");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleGenerateReflection = async () => {
    if (!graph || !selectedContext) return;

    const content = memoryForAi.trim();
    if (!content || memoryContentMode === "metadata-only") {
      setInsightError("Please unlock your memory or write a public one first.");
      return;
    }

    setIsGeneratingReflection(true);
    setInsightError(null);
    setReflectionSuccess(false);

    try {
      const response = await fetch("/api/reflections/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          memoryContent: content,
          modifiers: selectedContext.payload.modifiers,
          interpreter: selectedContext.payload.interpreter,
          context: selectedContext.payload.context,
          authority: selectedContext.payload.authority,
          priorReflections: graph.insights
            .map((insight) => getInsightDisplayText(insight.payload))
            .filter((text) => !text.startsWith("Encrypted"))
            .slice(0, 5),
          customPrompt: customPromptText !== defaultPrompt ? customPromptText : undefined,
        }),
      });

      const data = (await response.json()) as {
        insight?: string;
        promptHash?: string;
        model?: string;
        error?: string;
      };

      if (!response.ok || !data.insight) {
        throw new Error(data.error ?? "We couldn't generate a thought for you.");
      }

      setReflectionText(data.insight);
      setPromptHash(data.promptHash);
      setGeneratedModel(data.model ?? "groq");
      setSelectedModel(data.model ?? "groq");
      setSelectedPersona("custom");
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "AgentInsight generation failed.");
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const handleCreateReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    const stackKey = selectedContextKey || graph?.contexts[0]?.key;
    if (!graph || !stackKey) return;
    
    setIsSubmittingReflection(true);
    setTxStep("payload");
    setInsightError(null);
    setReflectionSuccess(false);

    try {
      if (encryptInsight && !insightPassphrase.trim()) {
        throw new Error("Please enter a secret key to encrypt this thought.");
      }

      const targetStack = graph.contexts.find((stack) => stack.key === stackKey);

      setTxStep("wallet");
      const encryptedInsight = encryptInsight
        ? await encryptString(insightText.trim(), insightPassphrase)
        : undefined;
      const reflectionContentMode: ContentMode = encryptInsight ? "encrypted" : "plaintext";

      setTxStep("broadcasting");
      const { record: createdInsight } = await createAgentInsight({
        memoryKey,
        memoryContextKey: stackKey,
        reflection: insightText.trim(),
        model: generatedModel || selectedModel,
        interpreter: targetStack?.payload.interpreter,
        context: targetStack?.payload.context,
        authority: targetStack?.payload.authority,
        contentMode: reflectionContentMode,
        encryptedInsight,
        previousInsightKey: replyToKey,
        lineageDepth: replyToKey ? (graph.insights.find(r => r.key === replyToKey)?.payload.lineageDepth ?? 0) + 1 : 0,
        promptHash,
      });

      setGraph((current) => {
        if (!current) return current;
        if (current.insights.some((existingInsight) => existingInsight.key === createdInsight.key)) {
          return current;
        }

        return {
          ...current,
          insights: [createdInsight, ...current.insights],
        };
      });
      setReflectionSuccess(true);
      setReflectionText("");
      setSelectedPersona("custom");
      setPromptHash(undefined);
      setReplyToKey(undefined);
      void loadGraph({ silent: true });
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "We couldn't save this thought to the blockchain. Please check your wallet connection.");
    } finally {
      setIsSubmittingReflection(false);
      setTxStep("idle");
    }
  };

  const handleExportGraph = () => {
    if (!graph) return;
    const dataStr = JSON.stringify(graph, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    }, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `memory-graph-${graph.memory.key.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reflectionsByParent = useMemo(() => {
    const map = new Map<string, ArkivEntityRecord<AgentInsightPayload>[]>();
    if (!graph) return map;
    for (const insight of graph.insights) {
      const parent = ref.payload.previousInsightKey || "root";
      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)!.push(ref);
    }
    return map;
  }, [graph]);

  const rootReflections = useMemo(() => {
    if (!graph) return [];
    const keys = new Set(graph.insights.map((r) => r.key));
    return graph.insights.filter(
      (r) => !r.payload.previousInsightKey || !keys.has(r.payload.previousInsightKey)
    );
  }, [graph]);

  async function handleUnlockInsight(reflection: ArkivEntityRecord<AgentInsightPayload>) {
    const encryptedInsight = insight.payload.encryptedInsight;
    if (!encryptedInsight) return;

    const passphrase = insightUnlockPassphrases[insight.key]?.trim();
    if (!passphrase) {
      setReflectionUnlockErrors((current) => ({
        ...current,
        [insight.key]: "Enter the secret key for this thought first.",
      }));
      return;
    }

    try {
      const decrypted = await decryptString(encryptedInsight, passphrase);
      setDecryptedReflections((current) => ({ ...current, [insight.key]: decrypted }));
      setReflectionUnlockErrors((current) => {
        const next = { ...current };
        delete next[insight.key];
        return next;
      });
    } catch {
      setReflectionUnlockErrors((current) => ({
        ...current,
        [insight.key]: "That secret key did not unlock this thought.",
      }));
    }
  }

  const renderReflectionNode = (
    insight: ArkivEntityRecord<AgentInsightPayload>,
    depth: number = 0
  ) => {
    const children = reflectionsByParent.get(insight.key) || [];
    const sortedChildren = [...children].sort(
      (a, b) => new Date(a.payload.createdAt).getTime() - new Date(b.payload.createdAt).getTime()
    );

    return (
      <div key={insight.key} className="relative mt-4">
        <div 
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 relative overflow-hidden shadow-sm transition-all hover:shadow"
          style={{ marginLeft: `${Math.min(depth, 4) * 1.5}rem` }}
        >
          {depth > 0 && (
            <div className="absolute left-[-1.25rem] top-6 w-[1.25rem] border-t-2 border-dashed border-indigo-200 dark:border-indigo-800/80" />
          )}
          <div className="absolute top-0 right-0 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-bl">
            {insight.payload.model}
          </div>
          {insight.payload.contentMode === "encrypted" ? (
            decryptedInsights[insight.key] ? (
              <div className="mt-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Private Thought (Unlocked)</span>
                </div>
                <p className="text-sm italic text-slate-800 dark:text-slate-200 leading-relaxed">
                  &ldquo;{decryptedInsights[insight.key]}&rdquo;
                </p>
              </div>
            ) : (
              <div className="mt-2 rounded-lg bg-amber-500/5 dark:bg-amber-950/10 border border-amber-200/80 dark:border-amber-900/40 p-3.5">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider mb-2">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  <span>Private Thought (Locked)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  This thought was stored privately. Enter its secret key below to unlock it:
                </p>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="password"
                    placeholder="Secret key for this thought"
                    value={insightUnlockPassphrases[insight.key] ?? ""}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setReflectionUnlockPassphrases((current) => ({
                        ...current,
                        [insight.key]: nextValue,
                      }));
                      setReflectionUnlockErrors((current) => {
                        const next = { ...current };
                        delete next[insight.key];
                        return next;
                      });
                    }}
                    className="input py-1 px-2.5 text-xs font-mono"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        await handleUnlockInsight(reflection);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleUnlockInsight(reflection)}
                    className="inline-flex items-center justify-center rounded bg-slate-900 dark:bg-slate-800 px-3 text-xs font-bold text-white dark:text-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
                {insightUnlockErrors[insight.key] ? (
                  <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                    {insightUnlockErrors[insight.key]}
                  </p>
                ) : null}
              </div>
            )
          ) : (
            <p className="text-sm italic text-slate-700 dark:text-slate-300 mt-2">
              &ldquo;{getReflectionDisplayText(insight.payload)}&rdquo;
            </p>
          )}
          <div className="mt-4 grid gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-500 dark:text-slate-400">
            <span>AI Model / Interpreter: {insight.payload.interpreter ?? "legacy"}</span>
            <span>Thought steps (lineage depth): {insight.payload.lineageDepth ?? 0}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{new Date(insight.payload.createdAt).toLocaleDateString()}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplyToKey(insight.key);
                  const formElement = document.querySelector("form");
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                title="Add a new thought that builds on this one"
                className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline cursor-pointer"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
              <a
                href={`/create?content=${encodeURIComponent(getReflectionDisplayText(insight.payload))}&title=Reflection-${insight.key.slice(2, 10)}&domain=${encodeURIComponent(graph?.memory.payload.domain || "")}`}
                title="Turn this thought into a brand new core memory"
                className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Promote
              </a>
              <a 
                href={arkivExplorerEntityUrl(insight.key)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] hover:text-[#4361ee] dark:hover:text-[#4cc9f0] underline"
              >
                Blockchain Record ({truncateMiddle(insight.key, 6, 4)})
              </a>
            </div>
          </div>
        </div>
        {sortedChildren.map((child) => renderReflectionNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
            Your Memory & AI Thoughts
          </h1>
          <p className="mt-3 break-all font-mono text-sm font-bold text-slate-500">{memoryKey}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportGraph}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-black text-slate-800 dark:text-slate-200 transition hover:-translate-y-0.5 hover:border-slate-950 dark:hover:border-slate-200 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Memory Data (JSON)
          </button>
          <button
            type="button"
            onClick={() => void loadGraph()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-black text-slate-800 dark:text-slate-200 transition hover:-translate-y-0.5 hover:border-slate-950 dark:hover:border-slate-200 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Refresh Memory Map
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-[#ff6b6b] bg-[#fff0f0] dark:bg-red-950/20 p-4 text-sm font-semibold text-[#9d0208] dark:text-red-400">
          {error}
        </div>
      ) : null}

      {isLoading && !graph ? (
        <div className="grid min-h-[420px] place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4361ee]" aria-hidden />
            <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">Loading your AI&apos;s mind map...</p>
          </div>
        </div>
      ) : null}

      {graph ? (
        <>
          <MemoryGraph
            memory={graph.memory}
            contexts={graph.contexts}
            insights={graph.insights}
          />

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <div className="grid gap-5">
              <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">{graph.memory.payload.title}</h2>
                {memoryContentMode === "encrypted" ? (
                  <div className="mt-5 rounded-lg border dark:border-slate-800 p-4 transition-all">
                    {!decryptedMemory ? (
                      <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 mb-4 rounded">
                        <div className="flex gap-2">
                          <LockKeyhole className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <h4 className="text-sm font-black text-amber-800 dark:text-amber-300">This memory is private & locked</h4>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-700 dark:text-amber-450">
                              To read this memory, enter the secret key below. Your key never leaves your browser.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-4 mb-4 rounded">
                        <div className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300">Great news! Your memory has been successfully unlocked in your browser.</h4>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-700 dark:text-emerald-455">
                              Your secret key is safely stored for this session.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!decryptedMemory ? (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          type="password"
                          value={decryptPassphrase}
                          onChange={(event) => setDecryptPassphrase(event.target.value)}
                          className="input"
                          placeholder="Your secret key"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => void handleDecryptMemory()}
                          disabled={isDecrypting || !decryptPassphrase.trim()}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-slate-800 px-4 text-sm font-black text-white dark:text-slate-100 disabled:opacity-60 cursor-pointer"
                        >
                          {isDecrypting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                          Unlock Now!
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-sans text-base leading-relaxed text-slate-800 dark:text-slate-200 ring-2 ring-emerald-500/10">
                        {decryptedMemory}
                      </div>
                    )}
                    {decryptError ? (
                      <p className="mt-3 text-sm font-semibold text-[#9d0208] dark:text-red-400">{decryptError}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-lg leading-8 text-slate-700 dark:text-slate-300">{getMemoryDisplayContent(graph.memory.payload)}</p>
                )}
                <dl className="mt-5 grid gap-3 sm:grid-cols-4">
                  <MiniMeta label="Category" value={graph.memory.payload.domain} />
                  <MiniMeta label="Who can see it?" value={graph.memory.payload.visibility} />
                  <MiniMeta label="How it's stored" value={memoryContentMode} />
                  <MiniMeta label="Saved On" value={graph.memory.payload.createdAt} />
                </dl>
              </article>

              {/* Agent Reflection Sandbox Panel */}
              <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Sparkles className="h-5 w-5 text-[#4361ee]" aria-hidden />
                  <h2 className="text-xl font-black text-slate-950 dark:text-slate-100">Your AI&apos;s Thoughts</h2>
                </div>

                {graph.contexts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-[#f8fbff] dark:bg-slate-900/10 p-5">
                    <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-white dark:bg-slate-900 text-[#4361ee] dark:text-[#4cc9f0] ring-1 ring-slate-200 dark:ring-slate-800">
                      <Sparkles className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="grid gap-4">
                      <p className="font-black text-slate-950 dark:text-slate-200">Your AI hasn&apos;t processed this memory yet.</p>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Set up a custom lens (modifier stack) so your AI can start interpreting and reflecting on this memory.
                      </p>
                      {contextError ? (
                        <div className="rounded-lg border border-[#ff6b6b] bg-[#fff0f0] dark:bg-red-950/20 p-3 text-sm font-semibold text-[#9d0208] dark:text-red-400">
                          {contextError}
                        </div>
                      ) : null}
                      {wallet ? (
                        <button
                          type="button"
                          onClick={() => void handleCreateDefaultStack()}
                          disabled={isCreatingContext}
                          className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-slate-800 px-5 text-sm font-black text-white dark:text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                          {isCreatingContext ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Sparkles className="h-4 w-4" aria-hidden />
                          )}
                          {isCreatingContext ? "Setting up thought layer..." : "Create Thought Layer"}
                        </button>
                      ) : (
                        <div className="grid gap-3">
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Connect your digital wallet to set up a lens for this memory.
                          </p>
                          {availableProviders().length === 0 ? (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm text-slate-600 dark:text-slate-400">
                              No digital wallet detected in your browser.
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {availableProviders().map((prov) => (
                                <button
                                  key={prov.uuid}
                                  type="button"
                                  onClick={() => void handleConnectProvider(prov.uuid)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={prov.icon} alt="" className="h-4 w-4 rounded object-contain" />
                                  <span>Connect {prov.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateReflection} className="grid gap-4">
                    {insightSuccess && (
                      <div className="flex items-center gap-3 rounded-lg border border-[#06d6a0] bg-[#ebfff8] dark:bg-emerald-950/20 p-3 text-sm font-bold text-[#006d5b] dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#06d6a0]" />
                        Your AI&apos;s new memory has been safely saved on the Arkiv Blockchain!
                      </div>
                    )}

                    {insightError && (
                      <div className="flex items-center gap-3 rounded-lg border border-[#ff6b6b] bg-[#fff0f0] dark:bg-red-950/20 p-3 text-sm font-semibold text-[#9d0208] dark:text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0 text-[#ff6b6b]" />
                        <span className="break-words">{insightError}</span>
                      </div>
                    )}

                    {replyToKey && (
                      <div className="flex items-center justify-between rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                        <span>
                          Replying to thought: <code className="font-mono text-xs">{truncateMiddle(replyToKey, 8, 6)}</code>
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyToKey(undefined)}
                          className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>Choose a lens (Thought Layer)</span>
                        <select
                          value={effectiveSelectedStackKey}
                          onChange={(e) => setSelectedStackKey(e.target.value)}
                          className="input"
                          required
                        >
                          {graph.contexts.map((stack, idx) => (
                            <option key={stack.key} value={stack.key}>
                              Lens {idx + 1} ({truncateMiddle(stack.key, 8, 6)})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <span>Choose a thinking style (optional)</span>
                        <select
                          value={selectedPersona}
                          onChange={(e) => handlePersonaChange(e.target.value)}
                          className="input"
                        >
                          {REFLECTION_PERSONAS.map((persona) => (
                            <option key={persona.id} value={persona.id}>
                              {persona.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8fbff] dark:bg-slate-900/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-slate-200">Let the AI reflect on this</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                            Our AI companion will read the memory through your chosen lens and share its thoughts.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleGenerateReflection()}
                          disabled={
                            isGeneratingInsight ||
                            !selectedContext ||
                            !memoryForAi.trim() ||
                            memoryContentMode === "metadata-only"
                          }
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-slate-800 px-4 text-sm font-black text-white dark:text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                        >
                          {isGeneratingInsight ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <WandSparkles className="h-4 w-4" aria-hidden />
                          )}
                          {memoryContentMode === "encrypted" && !decryptedMemory
                            ? "Unlock memory first"
                            : "Let AI Generate"}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Prompt Debugger Sandbox */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/10">
                      <button
                        type="button"
                        onClick={() => setShowPromptDebugger(!showPromptDebugger)}
                        className="flex items-center justify-between w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <WandSparkles className="h-3.5 w-3.5 text-indigo-500" />
                          AI Instruction Sandbox (Advanced)
                        </span>
                        <span>{showPromptDebugger ? "Hide Instructions ▲" : "See the AI's Instructions ▼"}</span>
                      </button>
                      {showPromptDebugger && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Here is the exact recipe we send to the AI. You can tweak it here if you&apos;d like:
                          </p>
                          <textarea
                            value={customPromptText}
                            onChange={(e) => setCustomPromptText(e.target.value)}
                            className="w-full min-h-36 text-xs font-mono p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomPromptText(defaultPrompt)}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                          >
                            Reset to original instructions
                          </button>
                        </div>
                      )}
                    </div>

                    {insightText && selectedContext && (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-4 mt-2">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                          How the AI Processed It
                        </h3>
                        <div className="relative border-l-2 border-slate-300 dark:border-slate-700 pl-4 space-y-4">
                          {/* Original Memory */}
                          <div className="relative">
                            <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-700" />
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">What you wrote</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-h-24 overflow-y-auto bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                              {memoryForAi}
                            </p>
                          </div>

                          {/* Modifiers */}
                          {selectedContext.payload.modifiers.map((mod, idx) => (
                            <div key={mod} className="relative">
                              <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#4cc9f0]" />
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Lens modifier {idx + 1}: <code className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.5 rounded font-mono">{mod}</code>
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {getModifierDescription(mod)}
                              </p>
                            </div>
                          ))}

                          {/* Final Reflection */}
                          <div className="relative">
                            <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">The AI&apos;s Interpretation</h4>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-h-32 overflow-y-auto bg-emerald-50/50 dark:bg-emerald-950/10 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                              {insightText}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <span>The AI&apos;s Thought</span>
                      <textarea
                        value={insightText}
                        onChange={(e) => {
                          setReflectionText(e.target.value);
                          setSelectedPersona("custom");
                        }}
                        className="input min-h-24 font-mono text-sm"
                        placeholder="What should the AI's response be? Or let it generate one above..."
                        required
                      />
                    </label>

                    <div className="grid gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
                      <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={encryptInsight}
                          onChange={(event) => setEncryptReflection(event.target.checked)}
                          className="h-4 w-4"
                        />
                        Keep this thought private
                      </label>
                      {encryptInsight ? (
                        <input
                          type="password"
                          value={insightPassphrase}
                          onChange={(event) => setReflectionPassphrase(event.target.value)}
                          className="input"
                          placeholder="Secret key for this thought"
                          autoComplete="new-password"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Public thoughts can be read by anyone on the blockchain.
                        </p>
                      )}
                    </div>

                    {isSubmittingInsight && (
                      <div className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-4 transition-all">
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving to the Blockchain...
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2.5 text-xs font-bold">
                            <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                              txStep === "payload" ? "bg-indigo-600 text-white animate-pulse" : "bg-emerald-500 text-white"
                            }`}>
                              {txStep === "payload" ? "1" : "✓"}
                            </span>
                            <span className={txStep === "payload" ? "text-indigo-900 dark:text-indigo-200" : "text-slate-500 dark:text-slate-400"}>
                              Getting your private thought ready...
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-bold">
                            <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                              txStep === "payload" ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500" :
                              txStep === "wallet" ? "bg-indigo-600 text-white animate-pulse" : "bg-emerald-500 text-white"
                            }`}>
                              {txStep === "payload" ? "2" : txStep === "wallet" ? "2" : "✓"}
                            </span>
                            <span className={txStep === "wallet" ? "text-indigo-900 dark:text-indigo-200" : "text-slate-500 dark:text-slate-400"}>
                              Asking for your digital signature...
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-bold">
                            <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                              txStep === "broadcasting" ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                            }`}>
                              3
                            </span>
                            <span className={txStep === "broadcasting" ? "text-indigo-900 dark:text-indigo-200" : "text-slate-500 dark:text-slate-400"}>
                              Sending to Arkiv blockchain & confirming...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {wallet ? (
                      <button
                        type="submit"
                        disabled={isSubmittingInsight || !insightText.trim()}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmittingInsight ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Send className="h-4 w-4" aria-hidden />
                        )}
                        {isSubmittingInsight
                          ? txStep === "broadcasting"
                            ? "Confirming on Arkiv..."
                            : txStep === "wallet"
                              ? "Waiting for signature..."
                              : "Preparing thought..."
                          : "Save this Memory to the Blockchain"}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-3 rounded-lg border border-[#ffd166] bg-[#fffdf0] dark:bg-amber-950/10 p-4 text-sm text-[#8a6d00] dark:text-amber-400 mt-2">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-5 w-5 shrink-0 text-[#f5a623] animate-pulse" />
                          <div>
                            <p className="font-bold">Connect your wallet to proceed</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">You need a digital wallet to save thoughts on the Arkiv blockchain:</p>
                          </div>
                        </div>
                        {(() => {
                          const providersForReflection = availableProviders();

                          if (providersForReflection.length === 0) {
                            return (
                              <div className="flex gap-2 rounded border border-[#ff6b6b] bg-[#fff0f0] dark:bg-red-950/20 p-2.5 text-xs font-semibold text-[#9d0208] dark:text-red-400">
                                <AlertCircle className="h-4 w-4 shrink-0 text-[#ff6b6b]" />
                                <span>No digital wallet detected in your browser. Please install a wallet like MetaMask.</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {providersForReflection.map((prov) => (
                                <button
                                  key={prov.uuid}
                                  type="button"
                                  onClick={() => void handleConnectProvider(prov.uuid)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={prov.icon} alt="" className="h-4 w-4 rounded object-contain" />
                                  <span>Connect {prov.name}</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </form>
                )}
              </article>
            </div>

            <aside className="grid gap-4 content-start">
              {graph.contexts.map((stack, index) => (
                <div key={stack.key} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fbffef] dark:bg-slate-900/10 p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    AI Lens {index + 1}
                  </h3>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {stack.payload.modifiers.map((item, itemIndex) => (
                      <ModifierToken key={item} modifier={item} index={itemIndex} />
                    ))}
                  </div>
                  <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{stack.payload.context}</p>
                  <EntityMeta record={stack} />
                </div>
              ))}
            </aside>

            {/* Agent Reflections History */}
            <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 lg:col-span-2 shadow-sm">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-950 dark:text-slate-100">
                <Sparkles className="h-5 w-5 text-[#4361ee]" aria-hidden />
                History of AI Thoughts ({graph.insights.length})
              </h2>
              {graph.insights.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 italic">No thoughts recorded yet. Use the form above to save the first interpretation!</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {rootReflections.map((root) => renderReflectionNode(root, 0))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8fbff] dark:bg-slate-900/30 p-3">
      <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-300">{value}</dd>
    </div>
  );
}
