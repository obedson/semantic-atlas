import { NextResponse } from "next/server";

import {
  buildReflectionPrompt,
  hashReflectionPrompt,
  type ReflectionGenerationInput,
} from "@/lib/reflection";

export const runtime = "nodejs";

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function isGenerationInput(value: unknown): value is ReflectionGenerationInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;

  return (
    typeof input.memoryContent === "string" &&
    Array.isArray(input.modifiers) &&
    input.modifiers.every((item) => typeof item === "string") &&
    typeof input.interpreter === "string" &&
    typeof input.context === "string" &&
    typeof input.authority === "string"
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY is not configured. Add it in Vercel project settings to generate AgentReflections.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (!isGenerationInput(body)) {
    return NextResponse.json(
      { error: "Invalid reflection generation request." },
      { status: 400 },
    );
  }

  const memoryContent = body.memoryContent.trim();
  if (!memoryContent || memoryContent.length > 8_000) {
    return NextResponse.json(
      { error: "Memory content must be between 1 and 8000 characters." },
      { status: 400 },
    );
  }

  const customPrompt = (body as ReflectionGenerationInput & { customPrompt?: string }).customPrompt;
  const prompt = typeof customPrompt === "string" && customPrompt.trim() !== ""
    ? customPrompt.trim()
    : buildReflectionPrompt(body);
  const promptHash = hashReflectionPrompt(prompt);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      max_tokens: 260,
      messages: [
        {
          role: "system",
          content:
            "You create concise semantic interpretation artifacts for user-owned AI memory graphs.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Groq reflection generation failed with status ${response.status}.` },
      { status: 502 },
    );
  }

  const data = (await response.json()) as GroqChatResponse;
  const reflection = data.choices?.[0]?.message?.content?.trim();

  if (!reflection) {
    return NextResponse.json(
      { error: "Groq returned an empty AgentReflection." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    reflection,
    promptHash,
    model,
    interpreter: body.interpreter,
  });
}
