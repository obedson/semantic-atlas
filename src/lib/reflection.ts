import { createHash } from "crypto";
import { buildReflectionPrompt, type ReflectionPromptInput } from "./prompt-utils";

export type ReflectionGenerationInput = ReflectionPromptInput;

export type ReflectionGenerationOutput = {
  reflection: string;
  promptHash: string;
  model: string;
  interpreter: string;
};

export { buildReflectionPrompt };

export function hashReflectionPrompt(prompt: string) {
  return createHash("sha256").update(prompt).digest("hex");
}
