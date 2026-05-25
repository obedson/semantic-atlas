"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  EyeOff,
  Globe,
  Key,
  Loader2,
  LockKeyhole,
  Plus,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { createMemoryNode, createMemoryContext } from "@/lib/arkiv";
import {
  DEMO_AUTHORITY,
  DEMO_CONTEXT,
  DEMO_INTERPRETER,
  DEMO_MEMORY_CONTENT,
  DEMO_MEMORY_DOMAIN,
  DEMO_MEMORY_TITLE,
  DEMO_MODIFIERS,
  PROJECT_ATTRIBUTE,
} from "@/lib/constants";
import { encryptString } from "@/lib/crypto";
import { type ContentMode, type Visibility } from "@/lib/schema";
import { truncateMiddle } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";

import { EntityMeta } from "./EntityMeta";
import { MemoryGraph } from "./MemoryGraph";

type CreateResult = {
  memoryKey?: string;
  memoryContextKey?: string;
  memoryTx?: string;
  memoryContextTx?: string;
  memoryRecord?: Awaited<ReturnType<typeof createMemoryNode>>["record"];
  contextRecord?: Awaited<ReturnType<typeof createMemoryContext>>["record"];
};

const MODIFIER_PRESETS = [
  {
    group: "🧠 Cognitive Strategy",
    items: [
      { name: "remember", label: "💾 permanent", desc: "Tells the AI this memory must be retained indefinitely" },
      { name: "deep-reasoning", label: "🧠 reasoning", desc: "Forces the model to expand step-by-step logic" },
      { name: "detail-oriented", label: "🔍 detailed", desc: "Extracts highly granular facts and parameters" },
    ],
  },
  {
    group: "⚡ Tone & Response Style",
    items: [
      { name: "fast-summarize", label: "⚡ concise", desc: "Delivers rapid, bite-sized bullet points" },
      { name: "creative-tone", label: "🎨 creative", desc: "Applies imaginative metaphors and dynamic framing" },
      { name: "be-encouraging", label: "🤝 supportive", desc: "Maintains a constructive, supportive voice" },
    ],
  },
  {
    group: "🛡️ Security & Routing",
    items: [
      { name: "private-reasoning", label: "🔒 private-thought", desc: "Restricts semantic thinking loops from leaking" },
      { name: "route:secure-vault", label: "🛡️ vault-route", desc: "Applies high-compliance audit pathways" },
    ],
  },
];

export function CreateExperience() {
  const [title, setTitle] = useState(DEMO_MEMORY_TITLE);
  const [content, setContent] = useState(DEMO_MEMORY_CONTENT);
  const [domain, setDomain] = useState(DEMO_MEMORY_DOMAIN);
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [contentMode, setContentMode] = useState<ContentMode>("encrypted");
  const [passphrase, setPassphrase] = useState("");
  const [activeModifiers, setActiveModifiers] = useState<string[]>(DEMO_MODIFIERS);
  const [newModifierInput, setNewModifierInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  
  const wallet = useWallet();

  const [interpreter, setInterpreter] = useState(DEMO_INTERPRETER);
  const [context, setContext] = useState(DEMO_CONTEXT);
  const [authority, setAuthority] = useState(DEMO_AUTHORITY);

  const parsedModifiers = activeModifiers;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const c = searchParams.get("content");
      const t = searchParams.get("title");
      const d = searchParams.get("domain") || searchParams.get("category");
      setTimeout(() => {
        if (c) setContent(c);
        if (t) setTitle(t);
        if (d) setDomain(d);
      }, 0);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (contentMode === "encrypted" && !passphrase.trim()) {
        throw new Error("Enter a passphrase before creating an encrypted memory.");
      }

      const encryptedContent =
        contentMode === "encrypted" ? await encryptString(content, passphrase) : undefined;

      const memoryResult = await createMemoryNode({
        title,
        content,
        domain,
        visibility,
        contentMode,
        encryptedContent,
        contentPreview:
          contentMode === "plaintext"
            ? content
            : `${content.slice(0, 96)}${content.length > 96 ? "..." : ""}`,
      });

      setResult({
        memoryKey: memoryResult.entityKey,
        memoryTx: memoryResult.txHash,
        memoryRecord: memoryResult.record,
      });

      const contextResult = await createMemoryContext({
        memoryKey: memoryResult.entityKey,
        modifiers: parsedModifiers,
        interpreter,
        context,
        authority,
      });

      setResult({
        memoryKey: memoryResult.entityKey,
        memoryContextKey: contextResult.entityKey,
        memoryTx: memoryResult.txHash,
        memoryContextTx: contextResult.txHash,
        memoryRecord: memoryResult.record,
        contextRecord: contextResult.record,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save to Arkiv.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Security mode computed state
  const activeSecurityMode =
    contentMode === "plaintext" && visibility === "public"
      ? "public"
      : contentMode === "metadata-only" && visibility === "shared"
      ? "confidential"
      : "encrypted";

  const handleSecuritySelect = (mode: "public" | "confidential" | "encrypted") => {
    if (mode === "public") {
      setContentMode("plaintext");
      setVisibility("public");
    } else if (mode === "confidential") {
      setContentMode("metadata-only");
      setVisibility("shared");
    } else {
      setContentMode("encrypted");
      setVisibility("private");
    }
  };

  const handleAddCustomModifier = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newModifierInput.trim();
    if (!trimmed) return;

    // Support typing multiple comma/space separated modifiers
    const parts = trimmed.split(/[\s,]+/);
    const newTags = [...activeModifiers];
    let addedAny = false;

    parts.forEach((p) => {
      const normalized = p.trim().replace(/\s+/g, "-").toLowerCase();
      if (normalized && !newTags.includes(normalized)) {
        newTags.push(normalized);
        addedAny = true;
      }
    });

    if (addedAny) {
      setActiveModifiers(newTags);
    }
    setNewModifierInput("");
  };

  const toggleModifier = (name: string) => {
    if (activeModifiers.includes(name)) {
      setActiveModifiers(activeModifiers.filter((m) => m !== name));
    } else {
      setActiveModifiers([...activeModifiers, name]);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] lg:px-8">
      {/* Form Experience */}
      <section className="grid content-start gap-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600/10">
            <Sparkles className="h-3 w-3" /> Live Memory Atlas
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Save a memory your AI will carry
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Every memory payload and modifier stack is registered securely on Braga testnet under your project namespace:
            <code className="ml-1.5 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200">
              {PROJECT_ATTRIBUTE}
            </code>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          {/* Title & Category Row */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Memory Title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Name this cognitive pattern..."
                className="input"
                required
              />
            </Field>
            <Field label="Category / Domain">
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="e.g. personal-cognition, trading-rules"
                className="input"
                required
              />
            </Field>
          </div>

          {/* Memory Textarea */}
          <Field label="Memory Content Payload">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What instructions, knowledge, or decision-making rules should the AI remember?"
              className="input min-h-32 resize-y text-slate-800"
              required
            />
          </Field>

          {/* SECURITY LEVEL SELECTOR CARDS */}
          <div className="grid gap-2">
            <span className="text-sm font-bold text-slate-800">Security & Privacy Level</span>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Card 1: Public */}
              <button
                type="button"
                onClick={() => handleSecuritySelect("public")}
                className={`relative flex flex-col rounded-xl border p-4 text-left transition cursor-pointer select-none ${
                  activeSecurityMode === "public"
                    ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg p-2 ${activeSecurityMode === "public" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    <Globe className="h-4 w-4" />
                  </span>
                  {activeSecurityMode === "public" && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">Public Memory</h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  Full content is saved in plaintext on Braga. Searchable and readable by anyone.
                </p>
              </button>

              {/* Card 2: Confidential */}
              <button
                type="button"
                onClick={() => handleSecuritySelect("confidential")}
                className={`relative flex flex-col rounded-xl border p-4 text-left transition cursor-pointer select-none ${
                  activeSecurityMode === "confidential"
                    ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg p-2 ${activeSecurityMode === "confidential" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    <EyeOff className="h-4 w-4" />
                  </span>
                  {activeSecurityMode === "confidential" && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">Confidential Metadata</h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  Content text is omitted from the ledger entirely. Only search keywords and tags remain public.
                </p>
              </button>

              {/* Card 3: Encrypted */}
              <button
                type="button"
                onClick={() => handleSecuritySelect("encrypted")}
                className={`relative flex flex-col rounded-xl border p-4 text-left transition cursor-pointer select-none ${
                  activeSecurityMode === "encrypted"
                    ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-lg p-2 ${activeSecurityMode === "encrypted" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  {activeSecurityMode === "encrypted" && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">Fully Encrypted</h3>
                <p className="mt-1 text-xs text-slate-500 leading-normal">
                  Payload is encrypted client-side using AES-GCM before write. Only readable with your key.
                </p>
              </button>
            </div>
          </div>

          {/* Secure Passphrase Input */}
          {activeSecurityMode === "encrypted" && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/15 p-4.5 animate-fade-in">
              <Field label="Secret Passphrase Key">
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="h-4 w-4 text-indigo-500" />
                  </div>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(event) => setPassphrase(event.target.value)}
                    placeholder="Enter an encryption passphrase..."
                    className="input pl-9"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </Field>
              <div className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-indigo-700 font-medium">
                <LockKeyhole className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                <span>
                  <strong>On-Device Privacy Secured</strong>: Encryption takes place locally in your browser. Neither Braga node operators nor the application middleware can ever view your raw memory without this phrase.
                </span>
              </div>
            </div>
          )}

          {/* INTERACTIVE MODIFIER TAG BUILDER */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 grid gap-4">
            <div>
              <span className="text-sm font-bold text-slate-900">AI Instructions (Memory Context)</span>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Determine how models interpret and implement this memory. Click presets or type custom values below.
              </p>
            </div>

            {/* Custom tag typing */}
            <div className="flex gap-2">
              <input
                value={newModifierInput}
                onChange={(event) => setNewModifierInput(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddCustomModifier();
                  }
                }}
                placeholder="Type custom instructions (e.g. explain-simply, strict-mode) and press Enter..."
                className="input flex-1 bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddCustomModifier()}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 text-sm font-bold text-white transition cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </button>
            </div>

            {/* Active Pill Badge Elements */}
            {activeModifiers.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3.5">
                {activeModifiers.map((modifier) => (
                  <span
                    key={modifier}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 pl-2.5 pr-1.5 py-1 text-xs font-bold text-slate-800 border border-slate-200 transition"
                  >
                    <span>{modifier}</span>
                    <button
                      type="button"
                      onClick={() => setActiveModifiers(activeModifiers.filter((m) => m !== modifier))}
                      className="rounded-full p-0.5 hover:bg-slate-300 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg bg-white text-xs text-slate-400 font-medium">
                No active instructions added yet.
              </div>
            )}

            {/* Presets Library */}
            <div className="grid gap-3.5 mt-1 border-t border-slate-200/80 pt-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Presets Library</span>
              <div className="grid gap-3.5">
                {MODIFIER_PRESETS.map((group) => (
                  <div key={group.group} className="grid gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500">{group.group}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => {
                        const isActive = activeModifiers.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => toggleModifier(item.name)}
                            title={item.desc}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition cursor-pointer select-none ${
                              isActive
                                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            <span>{item.label}</span>
                            {isActive ? (
                              <X className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3 opacity-60" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE ADVANCED DRAWER */}
          <div className="border-t border-slate-200/80 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer select-none py-1.5"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  showAdvanced ? "rotate-180 text-slate-800" : ""
                }`}
              />
              <span className={showAdvanced ? "text-slate-900" : ""}>
                Advanced Engine Settings (Optional)
              </span>
            </button>

            {showAdvanced && (
              <div className="grid gap-4 sm:grid-cols-3 mt-4 rounded-xl border border-slate-200/60 bg-slate-50/30 p-4.5 animate-fade-in">
                <Field label="Interpreter (AI Model Key)">
                  <input
                    value={interpreter}
                    onChange={(event) => setInterpreter(event.target.value)}
                    className="input bg-white font-mono text-xs"
                  />
                </Field>
                <Field label="Authority Source">
                  <input
                    value={authority}
                    onChange={(event) => setAuthority(event.target.value)}
                    className="input bg-white font-mono text-xs"
                  />
                </Field>
                <Field label="Cognitive Context">
                  <input
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    className="input bg-white font-mono text-xs"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* WALLET AND SIGNING CONTROLS */}
          {wallet.connection ? (
            <div className="flex items-center gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 text-sm text-emerald-800 animate-fade-in">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-extrabold text-emerald-950">
                  Wallet Secured ({wallet.providerName || "Injected"})
                </p>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  Connected address: {truncateMiddle(wallet.connection.address, 10, 8)}. Ready to execute smart transactions.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50/30 p-4.5 text-sm text-amber-800 animate-fade-in">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 shrink-0 text-amber-500 animate-pulse" />
                <div>
                  <p className="font-extrabold text-amber-950">Web3 Node Authorization Required</p>
                  <p className="text-xs font-semibold text-amber-700 mt-0.5">
                    Connect a digital browser wallet to proceed writing semantic entities.
                  </p>
                </div>
              </div>

              {(() => {
                const allProviders = [...wallet.providers];
                if (
                  wallet.legacyProvider &&
                  !wallet.providers.some((p) => p.rdns === wallet.legacyProvider?.rdns || p.name === wallet.legacyProvider?.name)
                ) {
                  allProviders.push(wallet.legacyProvider);
                }

                if (allProviders.length === 0) {
                  return (
                    <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50/30 p-3 text-xs font-bold text-red-700">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                      <span>
                        No compatible injected dApp extensions (MetaMask, Coinbase Wallet, OKX, Rabby) found. Please install an extension to proceed.
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/50 mt-1">
                    {allProviders.map((prov) => (
                      <button
                        key={prov.uuid}
                        type="button"
                        onClick={async () => {
                          setError(null);
                          try {
                            await wallet.connect(prov.uuid);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Connection failed");
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm transition cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prov.icon}
                          alt=""
                          className="h-4 w-4 rounded object-contain shrink-0"
                        />
                        <span>Connect {prov.name}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/35 p-3.5 text-xs font-bold text-red-700 animate-fade-in flex items-start gap-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-950 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden />
            ) : (
              <PlusCircle className="h-4.5 w-4.5" aria-hidden />
            )}
            {isSubmitting ? "Writing Memory graph to Braga..." : "Write to Braga Ledger"}
          </button>
        </form>
      </section>

      {/* Graph Visualizer Side */}
      <section className="grid content-start gap-6">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/20 p-5.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-indigo-600 ring-1 ring-slate-200 border border-slate-100 shadow-sm">
              <LockKeyhole className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Memory Record Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect receipts and unique entity keys once transaction confirmations conclude.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {result?.memoryRecord ? (
              <div>
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  MemoryNode
                </h3>
                <EntityMeta record={result.memoryRecord} txHash={result.memoryTx} />
              </div>
            ) : null}
            {result?.contextRecord ? (
              <div>
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  MemoryContext
                </h3>
                <EntityMeta record={result.contextRecord} txHash={result.memoryContextTx} />
              </div>
            ) : null}
            {result?.memoryContextKey ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/25 p-3.5 text-xs font-bold text-emerald-800 animate-fade-in mt-1.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                <span>Memory and instructions successfully committed.</span>
                <Link
                  href={`/memory/${encodeURIComponent(result.memoryKey ?? "")}`}
                  className="inline-flex items-center gap-1 rounded bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition ml-auto shadow-sm decoration-0"
                >
                  Inspect memory graph <ArrowRight className="h-3.5 w-3.5 ml-0.5" aria-hidden />
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <MemoryGraph
          memory={result?.memoryRecord}
          contexts={result?.contextRecord ? [result.contextRecord] : []}
        />
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-800">
      <span>{label}</span>
      {children}
    </label>
  );
}
