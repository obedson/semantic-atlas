export type ReflectionPromptInput = {
  memoryContent: string;
  modifiers: string[];
  interpreter: string;
  context: string;
  authority: string;
  priorReflections?: string[];
};

export function buildReflectionPrompt(input: ReflectionPromptInput) {
  const prior = input.priorReflections?.filter(Boolean).slice(0, 5) ?? [];

  return [
    "You are generating an AgentReflection for ModifierVault.",
    "An AgentReflection is a portable semantic interpretation artifact, not a chat reply.",
    "Read the user-owned memory, apply the modifier stack as interpretive operators, and produce one compact reflection.",
    "",
    `Memory: ${input.memoryContent}`,
    `Modifier stack: ${input.modifiers.join(" -> ") || "remember"}`,
    `Interpreter: ${input.interpreter}`,
    `Context: ${input.context}`,
    `Authority: ${input.authority}`,
    prior.length ? `Prior reflections:\n${prior.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "Prior reflections: none",
    "",
    "Return 2-4 sentences. Make it specific, reflective, and reusable by future agents.",
  ].join("\n");
}
