import { DEMO_MODIFIERS } from "@/lib/constants";

const palette = [
  "border-[#ff6b6b] bg-[#fff0f0] text-[#9d0208]",
  "border-[#06d6a0] bg-[#ebfff8] text-[#006d5b]",
  "border-[#4361ee] bg-[#edf1ff] text-[#2337a6]",
  "border-[#b8f35a] bg-[#f5ffe6] text-[#436000]",
  "border-[#f4a261] bg-[#fff4e8] text-[#8a4200]",
];

export function ModifierToken({
  modifier,
  index = 0,
}: {
  modifier: string;
  index?: number;
}) {
  const color =
    palette[
      Math.max(
        0,
        DEMO_MODIFIERS.indexOf(modifier) >= 0 ? DEMO_MODIFIERS.indexOf(modifier) : index,
      ) % palette.length
    ];

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${color}`}
    >
      {modifier}
    </span>
  );
}
