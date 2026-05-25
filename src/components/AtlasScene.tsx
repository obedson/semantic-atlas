"use client";

import {
  ArrowRight,
  Brain,
  Calendar,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  PlusCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { queryMemoryNodes, readMemoryGraph, arkivExplorerEntityUrl } from "@/lib/arkiv";
import { PROJECT_ATTRIBUTE } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import {
  type ArkivEntityRecord,
  type MemoryNodePayload,
  type MemoryContextPayload,
  type AgentInsightPayload,
} from "@/lib/schema";

import { MemoryGraph } from "./MemoryGraph";

export function AtlasScene() {
  const [memories, setMemories] = useState<ArkivEntityRecord<MemoryNodePayload>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemoryKey, setSelectedMemoryKey] = useState<string | null>(null);

  const [graphData, setGraphData] = useState<{
    memory?: ArkivEntityRecord<MemoryNodePayload>;
    contexts: ArkivEntityRecord<MemoryContextPayload>[];
    insights: ArkivEntityRecord<AgentInsightPayload>[];
  } | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);

  // Load all project memories on mount
  useEffect(() => {
    let isActive = true;
    async function loadMemories() {
      setIsLoading(true);
      setError(null);
      try {
        const records = await queryMemoryNodes();
        if (isActive) {
          setMemories(records);
          if (records.length > 0) {
            setSelectedMemoryKey(records[0].key);
          }
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load memories from Braga.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }
    void loadMemories();
    return () => {
      isActive = false;
    };
  }, []);

  // Fetch linked nodes whenever the selected memory changes
  useEffect(() => {
    if (!selectedMemoryKey) {
      Promise.resolve().then(() => setGraphData(null));
      return;
    }
    const memoryKeyVal = selectedMemoryKey;
    let isActive = true;
    async function loadGraph() {
      setIsGraphLoading(true);
      setError(null);
      try {
        const data = await readMemoryGraph(memoryKeyVal);
        if (isActive) {
          setGraphData(data);
        }
      } catch (err) {
        if (isActive) {
          setGraphData(null);
          setError(err instanceof Error ? err.message : "Failed to load the selected memory graph.");
        }
      } finally {
        if (isActive) {
          setIsGraphLoading(false);
        }
      }
    }
    void loadGraph();
    return () => {
      isActive = false;
    };
  }, [selectedMemoryKey]);

  // Determine active privacy badge
  const getPrivacyBadge = (payload: MemoryNodePayload) => {
    const mode = payload.contentMode ?? "plaintext";
    if (mode === "encrypted") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
          <ShieldAlert className="h-3 w-3" /> Encrypted
        </span>
      );
    }
    if (mode === "metadata-only") {
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          <EyeOff className="h-3 w-3" /> Confidential
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
        <Globe className="h-3 w-3" /> Public
      </span>
    );
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Panel */}
      <header className="flex flex-col gap-3.5 border-b border-slate-100 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
              <Sparkles className="h-3 w-3 text-slate-500" /> Graph Atlas Dashboard
            </span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Semantic AI Memory Atlas
            </h1>
            <p className="mt-2 text-base text-slate-500">
              Explore user-owned cognitive memory graphs and active instruction sets stored under:
              <code className="ml-1.5 rounded bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200">
                {PROJECT_ATTRIBUTE}
              </code>
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-950 px-5 text-sm font-black text-white shadow transition cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5" /> Save New Memory
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
          <p className="text-sm font-bold text-slate-500">Retrieving blockchain records from Braga...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/20 p-5 text-center max-w-2xl mx-auto my-10">
          <p className="text-sm font-bold text-red-700">Braga Connection Exception</p>
          <p className="text-xs text-red-600 mt-1 leading-normal">{error}</p>
        </div>
      ) : memories.length === 0 ? (
        /* ================= EMPTY STATE WITH MOCK VISUALIZATION ================= */
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center py-6">
          <div className="flex flex-col gap-6 max-w-xl">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Brain className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Namespace is currently empty
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                You have successfully migrated to the fresh, isolated blockchain seed namespace:
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200">
                  {PROJECT_ATTRIBUTE}
                </code>.
                This partition guarantees your workspace remains completely isolated from older, polluted test records.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/20 text-xs leading-relaxed text-slate-600 font-medium">
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                💡 Looking for previously stored memories?
              </span>
              <span>
                If you saved data in an earlier session, those memories are permanently secured on-chain under the old namespace key. Migrating to the clean v3 partition isolates the new build, but your old assets remain securely registered on Braga.
              </span>
            </div>

            <div>
              <Link
                href="/create"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-950 px-6 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 cursor-pointer"
              >
                🧠 Save your first Memory Node <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

          {/* Static demo preview for an empty namespace. */}
          <div className="grid gap-4.5 content-start">
            <div className="flex flex-col p-4.5 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sparkles className="h-4 w-4 text-indigo-500" /> Interactive Preview
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                This is a mockup of the visual mind map generated for saved memories.
              </p>
            </div>

            <MemoryGraph
              memory={{
                key: "demo-node-key",
                payload: {
                  entityType: "MemoryNode",
                  project: PROJECT_ATTRIBUTE,
                  title: "Private Thinking Pattern (Mock)",
                  content: "When confronted with complex logical puzzles, hold contradictory states in view first.",
                  contentMode: "plaintext",
                  domain: "personal-cognition",
                  visibility: "public",
                  createdAt: new Date().toISOString(),
                },
              }}
              contexts={[
                {
                  key: "demo-stack-key",
                  payload: {
                    entityType: "MemoryContext",
                    project: PROJECT_ATTRIBUTE,
                    memoryKey: "demo-node-key",
                    modifiers: ["remember", "deep-reasoning"],
                    interpreter: "cognition-atlas:v2",
                    context: "Instruction stack",
                    authority: "wallet-owner",
                    createdAt: new Date().toISOString(),
                  },
                },
              ]}
              insights={[
                {
                  key: "demo-ref-key",
                  payload: {
                    entityType: "AgentInsight",
                    project: PROJECT_ATTRIBUTE,
                    memoryKey: "demo-node-key",
                    memoryContextKey: "demo-stack-key",
                    insight: "Cognitive status: Ambiguity preserved correctly.",
                    model: "groq-llama-3.1",
                    createdAt: new Date().toISOString(),
                  },
                },
              ]}
            />
          </div>
        </div>
      ) : (
        /* ================= LIVE KNOWLEDGE GRAPH EXPLORER WORKSPACE ================= */
        <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Left Panel: Memories Directory */}
          <aside className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
                AI Memories ({memories.length})
              </h2>
            </div>

            <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
              {memories.map((rec) => {
                const isActive = selectedMemoryKey === rec.key;
                return (
                  <button
                    key={rec.key}
                    type="button"
                    onClick={() => setSelectedMemoryKey(rec.key)}
                    className={`flex flex-col items-start text-left w-full rounded-xl border p-4.5 transition cursor-pointer select-none ${
                      isActive
                        ? "border-indigo-600 bg-indigo-50/10 ring-1 ring-indigo-600 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <span className="font-extrabold text-sm text-slate-900 leading-snug break-words max-w-[200px]">
                        {rec.payload.title || "Untitled Memory"}
                      </span>
                      {getPrivacyBadge(rec.payload)}
                    </div>

                    <p className="mt-2 text-xs text-slate-500 font-semibold break-all leading-normal">
                      ID: {truncateMiddle(rec.key, 12, 10)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between w-full text-[10px] text-slate-400 font-bold border-t border-slate-100/80 pt-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-slate-400" /> {rec.payload.domain || "general"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />{" "}
                        {rec.payload.createdAt ? formatDate(rec.payload.createdAt) : "Recently"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Panel: Interactive Graph Workspace */}
          <section className="grid gap-6">
            {isGraphLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[480px] rounded-2xl border border-slate-200 bg-slate-50/15">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Assembling cryptographic relationships...
                </p>
              </div>
            ) : graphData ? (
              <div className="grid gap-5">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4.5">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Active Mind Map Workspace</h2>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Memory Node Address:{" "}
                      <code className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 break-all select-all">
                        {selectedMemoryKey}
                      </code>
                    </p>
                  </div>

                  <a
                    href={selectedMemoryKey ? arkivExplorerEntityUrl(selectedMemoryKey) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm transition"
                  >
                    <KeyRound className="h-4 w-4 text-slate-500" /> View Braga Records ↗
                  </a>
                </div>

                <MemoryGraph
                  memory={graphData.memory}
                  contexts={graphData.contexts}
                  insights={graphData.insights}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[480px] rounded-2xl border border-slate-200 bg-slate-50/15">
                <p className="text-sm font-bold text-slate-400">Select a memory from the directory to inspect its visual atlas.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function truncateMiddle(str: string, start = 8, end = 6) {
  if (!str) return "";
  if (str.length <= start + end) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}
