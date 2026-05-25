import { ArrowRight, DatabaseZap, Eye, Fingerprint, GitBranch, LockKeyhole } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { MemoryGraph } from "@/components/MemoryGraph";
import { ModifierToken } from "@/components/ModifierToken";
import {
  APP_TAGLINE,
  DEMO_AUTHORITY,
  DEMO_CONTEXT,
  DEMO_INTERPRETER,
  DEMO_MEMORY_CONTENT,
  DEMO_MEMORY_DOMAIN,
  DEMO_MEMORY_TITLE,
  DEMO_MODIFIERS,
  PROJECT_ATTRIBUTE,
  SCHEMA_VERSION,
} from "@/lib/constants";
import type { ArkivEntityRecord, MemoryNodePayload, ModifierStackPayload } from "@/lib/schema";

export default function Home() {
  const previewMemoryKey = "preview-memory-key";
  const previewMemory: Partial<ArkivEntityRecord<MemoryNodePayload>> = {
    key: previewMemoryKey,
    payload: {
      entityType: "MemoryNode" as const,
      project: PROJECT_ATTRIBUTE,
      schemaVersion: SCHEMA_VERSION,
      title: DEMO_MEMORY_TITLE,
      contentPreview: DEMO_MEMORY_CONTENT,
      contentMode: "encrypted" as const,
      domain: DEMO_MEMORY_DOMAIN,
      visibility: "private" as const,
      createdAt: new Date("2026-05-22T00:00:00.000Z").toISOString(),
    },
    attributes: [],
  };

  const previewStack: Partial<ArkivEntityRecord<ModifierStackPayload>> = {
    key: "preview-stack-key",
    payload: {
      entityType: "ModifierStack" as const,
      project: PROJECT_ATTRIBUTE,
      schemaVersion: SCHEMA_VERSION,
      memoryKey: previewMemoryKey,
      modifiers: DEMO_MODIFIERS,
      interpreter: DEMO_INTERPRETER,
      context: DEMO_CONTEXT,
      authority: DEMO_AUTHORITY,
      createdAt: new Date("2026-05-22T00:00:01.000Z").toISOString(),
    },
    attributes: [],
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid min-h-[calc(100vh-220px)] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-black tracking-tight text-slate-950 dark:text-white sm:text-7xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Imagine giving your AI a personal diary, a place to store everything it learns and experiences. ModifierVault helps you do just that. We save your AI&apos;s thoughts, insights, and even its &apos;moods&apos; to Arkiv Braga. This ensures your AI&apos;s knowledge is always safe, transparent, and yours to take wherever you go – never locked away by a single chat service.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 dark:bg-slate-800 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-slate-700"
            >
              Give Your AI a Memory <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/query"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black text-slate-800 dark:text-slate-200 transition hover:-translate-y-0.5 hover:border-slate-950 dark:hover:border-slate-700"
            >
              Explore Your AI&apos;s Mind
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {DEMO_MODIFIERS.map((modifier, index) => (
              <ModifierToken key={modifier} modifier={modifier} index={index} />
            ))}
          </div>
        </div>

        <MemoryGraph memory={previewMemory} stacks={[previewStack]} />
      </section>

      {/* How it works strip */}
      <section className="border-t border-slate-200/60 dark:border-slate-800/60 pt-10">
        <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">How It Works: A Simple Guide</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 1</div>
            <h3 className="mt-1 font-black text-slate-950 dark:text-white">Save a Core Memory</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Think of this as writing down a key fact or a significant event. You save this directly to the Arkiv blockchain, linked to your personal digital wallet. It&apos;s like having a secure, unchangeable record of what your AI knows.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Step 2</div>
            <h3 className="mt-1 font-black text-slate-950 dark:text-white">Shape Its Understanding</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Now, add &apos;Modifiers&apos; – these are like special filters. They don&apos;t change the original memory, but they guide how your AI interprets it. Want your AI to explain something like a pirate? Or perhaps focus on a specific detail? This is where you set those instructions.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-600">Step 3</div>
            <h3 className="mt-1 font-black text-slate-950 dark:text-white">See What It Thinks & Save</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Run your AI&apos;s memory through our system (powered by Groq) to see how those modifiers change its response. Once you&apos;re happy, save this &apos;reflection&apos; – it&apos;s like adding a new chapter to your AI&apos;s story, showing how it processed the information.
            </p>
          </div>
        </div>
      </section>

      {/* Plain English Guide */}
      <section className="border-t border-slate-200/60 dark:border-slate-800/60 pt-10">
        <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
          The Big Idea, Made Simple
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
          Think of ModifierVault like a personalized recipe book for your AI. Instead of just chatting with a bot, you get to choose the ingredients (memories) and the cooking style (modifiers) to create unique responses:
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.04)] dark:border-slate-800/85 dark:bg-slate-900/60">
            <h3 className="font-black text-slate-950 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              1. The Memory (The Fact)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <strong>Example:</strong> &ldquo;My favorite color is green.&rdquo;
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              This is the raw, pure information. It&apos;s entirely yours, stored securely with your digital wallet, and you can even keep it encrypted for extra privacy.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.04)] dark:border-slate-800/85 dark:bg-slate-900/60">
            <h3 className="font-black text-slate-950 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              2. The Modifier (The Lens)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <strong>Example:</strong> &ldquo;Explain to a 5-year-old&rdquo; + &ldquo;Speak like a pirate&rdquo;
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              These are the filters you apply. They don&apos;t change the original fact, but they change how your AI &apos;sees&apos; and responds to it. It&apos;s like looking at the same thing through different colored glasses.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.04)] dark:border-slate-800/85 dark:bg-slate-900/60">
            <h3 className="font-black text-slate-950 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              3. The Reflection (The Result)
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <strong>Example:</strong> &ldquo;Ahoy! Yer favorite shade be that of the green grass!&rdquo;
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
              This is your AI&apos;s final response, shaped by the modifiers. We record this securely so you can always look back, understand, and even trace how your AI arrived at its conclusions.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          icon={<Fingerprint className="h-5 w-5" aria-hidden />}
          title="You're the Owner"
          body="Your AI's data belongs to your digital wallet, not some big company. This frees your AI's personality from being stuck on closed platforms."
        />
        <FeatureCard
          icon={<GitBranch className="h-5 w-5" aria-hidden />}
          title="Mix & Match"
          body="Easily combine different modifiers in real-time. This lets you fine-tune how your AI behaves without ever changing its core memories."
        />
        <FeatureCard
          icon={<Eye className="h-5 w-5" aria-hidden />}
          title="See Everything"
          body="Every step, every change, who made it, and when – it's all recorded publicly on the blockchain. This means full transparency and auditability for your AI's journey."
        />
        <FeatureCard
          icon={<LockKeyhole className="h-5 w-5" aria-hidden />}
          title="Your Privacy, Your Choice"
          body="You decide how private your memories are. Store them as public text, as private summaries with public labels, or even fully encrypted so only you can read them."
        />
      </section>

      <section className="mb-16 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-center">
          <div>
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-slate-950 dark:bg-slate-800 text-[#4cc9f0]">
              <DatabaseZap className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Built for Arkiv ETHNS Braga.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              The app uses one unique project attribute on every entity and every query.
            </p>
          </div>
          <code className="block break-all rounded-lg border border-slate-200 dark:border-slate-800 bg-[#f8fbff] dark:bg-slate-900/80 p-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
            {PROJECT_ATTRIBUTE}
          </code>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-[#edf1ff] dark:bg-slate-800/80 text-[#2337a6] dark:text-[#4cc9f0]">
        {icon}
      </div>
      <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{body}</p>
    </article>
  );
}
