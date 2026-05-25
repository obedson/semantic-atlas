"use client";

import { DatabaseZap, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  queryMemoryNodes,
  queryMemoryNodesByModifier,
  queryMemoryContexts,
  readMemoryNode,
} from "@/lib/arkiv";
import { PROJECT_ATTRIBUTE } from "@/lib/constants";
import { formatDate, truncateMiddle } from "@/lib/format";
import {
  getMemoryDisplayContent,
  type ArkivEntityRecord,
  type ContentMode,
  type MemoryNodePayload,
  type MemoryContextPayload,
  type Visibility,
} from "@/lib/schema";

import { EntityMeta } from "./EntityMeta";
import { ModifierToken } from "./ModifierToken";

export function QueryExperience() {
  const [memoryKey, setMemoryKey] = useState("");
  const [modifier, setModifier] = useState("");
  const [domain, setDomain] = useState("");
  const [interpreter, setInterpreter] = useState("");
  const [contentMode, setContentMode] = useState<ContentMode | "">("");
  const [visibility, setVisibility] = useState<Visibility | "">("");
  const [owner, setOwner] = useState("");
  const [creator, setCreator] = useState("");
  const [memories, setMemories] = useState<ArkivEntityRecord<MemoryNodePayload>[]>([]);
  const [contexts, setContexts] = useState<ArkivEntityRecord<MemoryContextPayload>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const trimmedMemoryKey = memoryKey.trim();
      const trimmedModifier = modifier.trim();
      const trimmedDomain = domain.trim();
      const trimmedInterpreter = interpreter.trim();
      const trimmedOwner = owner.trim();
      const trimmedCreator = creator.trim();

      if (trimmedMemoryKey) {
        const [memory, linkedStacks] = await Promise.all([
          readMemoryNode(trimmedMemoryKey),
          queryMemoryContexts({ memoryKey: trimmedMemoryKey, includeLegacy: true }),
        ]);
        setMemories([memory]);
        setContexts(linkedStacks);
        return;
      }

      if (trimmedModifier) {
        const result = await queryMemoryNodesByModifier(trimmedModifier, 25, {
          interpreter: trimmedInterpreter || undefined,
        });
        const filteredMemories = result.memories.filter((memory) => {
          return (
            (!trimmedDomain || memory.payload.domain === trimmedDomain) &&
            (!contentMode || (memory.payload.contentMode ?? "plaintext") === contentMode) &&
            (!visibility || memory.payload.visibility === visibility)
          );
        });
        setMemories(filteredMemories);
        setContexts(result.contexts);
        return;
      }

      const projectMemories = await queryMemoryNodes({
        domain: trimmedDomain || undefined,
        contentMode: contentMode || undefined,
        visibility: visibility || undefined,
        owner: trimmedOwner || undefined,
        creator: trimmedCreator || undefined,
      });
      const linkedStacks = trimmedInterpreter
        ? await queryMemoryContexts({ interpreter: trimmedInterpreter })
        : [];
      setMemories(projectMemories);
      setContexts(linkedStacks);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Arkiv query failed.");
      setMemories([]);
      setContexts([]);
    } finally {
      setIsLoading(false);
    }
  }, [contentMode, creator, domain, interpreter, memoryKey, modifier, owner, visibility]);

  useEffect(() => {
    let isActive = true;

    async function loadProjectMemories() {
      setIsLoading(true);
      setError(null);

      try {
          const projectMemories = await queryMemoryNodes();

        if (isActive) {
          setMemories(projectMemories);
        }
      } catch (caught) {
        if (isActive) {
          setError(caught instanceof Error ? caught.message : "Arkiv query failed.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProjectMemories();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(360px,0.5fr)]">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Explore Your AI&apos;s Mind Map
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Easily find your saved memories and how you&apos;ve configured your AI. All your searches stay within your project&apos;s special area:{" "}
            <code className="rounded-md bg-white dark:bg-slate-950 px-2 py-1 font-mono text-sm text-slate-950 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-800">
              {PROJECT_ATTRIBUTE}
            </code>
            .
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runQuery();
          }}
          className="grid gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Memory Key <span className="text-xs font-normal text-slate-500 dark:text-slate-500">(looking for a specific memory? paste its unique ID here)</span></span>
              <input
                value={memoryKey}
                onChange={(event) => setMemoryKey(event.target.value)}
                placeholder="0x..."
                className="input font-mono text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Modifier <span className="text-xs font-normal text-slate-500 dark:text-slate-500">(search by how your AI was told to interpret things)</span></span>
              <input
                value={modifier}
                onChange={(event) => setModifier(event.target.value)}
                placeholder="route:private-reasoning"
                className="input font-mono text-sm"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Category</span>
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="personal-cognition"
                className="input font-mono text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>AI Model / Interpreter <span className="text-xs font-normal text-slate-500 dark:text-slate-500">(which AI processed it?)</span></span>
              <input
                value={interpreter}
                onChange={(event) => setInterpreter(event.target.value)}
                placeholder="cognition-atlas:v2"
                className="input font-mono text-sm"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>How it&apos;s stored</span>
              <select
                value={contentMode}
                onChange={(event) => setContentMode(event.target.value as ContentMode | "")}
                className="input cursor-pointer"
              >
                <option value="">any</option>
                <option value="plaintext">plaintext (public)</option>
                <option value="metadata-only">metadata-only (private content)</option>
                <option value="encrypted">encrypted (passphrase required)</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Who can see it?</span>
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as Visibility | "")}
                className="input cursor-pointer"
              >
                <option value="">any</option>
                <option value="private">private</option>
                <option value="shared">shared</option>
                <option value="public">public</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Owner Wallet <span className="text-xs font-normal text-slate-500 dark:text-slate-500">(whose memory is this?)</span></span>
              <input
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="0x..."
                className="input font-mono text-sm"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Creator Wallet <span className="text-xs font-normal text-slate-500 dark:text-slate-500">(who originally saved it?)</span></span>
              <input
                value={creator}
                onChange={(event) => setCreator(event.target.value)}
                placeholder="0x..."
                className="input font-mono text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer shadow-md"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Search className="h-4 w-4" aria-hidden />
            )}
            {isLoading ? "Searching…" : "Find It!"}
          </button>
        </form>
      </section>

      {error ? (
        <div className="rounded-lg border border-[#ff6b6b] dark:border-red-800 bg-[#fff0f0] dark:bg-red-950/20 p-4 text-sm font-semibold text-[#9d0208] dark:text-red-400 animate-fade-in">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-100">MemoryNodes</h2>
            <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">
              {memories.length} result{memories.length === 1 ? "" : "s"}
            </span>
          </div>

          {isLoading ? <Skeleton label="Loading memories from Arkiv" /> : null}
          {!isLoading && memories.length === 0 ? <EmptyState /> : null}

          {memories.map((memory) => (
            <article
              key={memory.key}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.07)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/memory/${encodeURIComponent(memory.key)}`}
                    className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100 underline decoration-[#4cc9f0] decoration-2 underline-offset-4 hover:text-[#4cc9f0]"
                  >
                    {memory.payload.title}
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{getMemoryDisplayContent(memory.payload)}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    <span>{memory.payload.domain}</span>
                    <span>{memory.payload.visibility}</span>
                    <span>{memory.payload.contentMode ?? "plaintext"}</span>
                    <span>{formatDate(memory.payload.createdAt)}</span>
                  </div>
                </div>
                <span className="rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8fbff] dark:bg-slate-900/50 px-3 py-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {truncateMiddle(memory.key)}
                </span>
              </div>
            </article>
          ))}
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#fbffef] dark:bg-slate-900/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <DatabaseZap className="h-4 w-4 text-[#436000]" aria-hidden />
              MemoryContexts
            </div>
            <div className="grid gap-4">
              {contexts.length === 0 ? (
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Enter a memory key or modifier to inspect linked contexts.
                </p>
              ) : null}
              {contexts.map((stack) => (
                <div key={stack.key} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {stack.payload.modifiers.map((item, index) => (
                      <ModifierToken key={item} modifier={item} index={index} />
                    ))}
                  </div>
                  <p className="mb-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{stack.payload.context}</p>
                  <EntityMeta record={stack} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Skeleton({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5">
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-900" />
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/72 dark:bg-slate-950/70 p-8 text-center">
      <p className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-100">No matching memories yet.</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        Create the MVP demo memory, then query by project or modifier.
      </p>
    </div>
  );
}
