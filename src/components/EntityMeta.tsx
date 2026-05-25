import { ExternalLink } from "lucide-react";

import { arkivExplorerEntityUrl, arkivExplorerTxUrl } from "@/lib/arkiv";
import { truncateMiddle } from "@/lib/format";
import type { ArkivEntityRecord, ModifierVaultPayload } from "@/lib/schema";

export function EntityMeta({
  record,
  txHash,
}: {
  record?: Partial<ArkivEntityRecord<ModifierVaultPayload>>;
  txHash?: string;
}) {
  if (!record?.key && !txHash) {
    return null;
  }

  const rows = [
    ["Arkiv key", record?.key],
    ["Owner", record?.owner],
    ["Creator", record?.creator],
    ["Created block", record?.createdAtBlock?.toString()],
    ["Tx hash", txHash ?? record?.txHash],
  ].filter(([, value]) => Boolean(value));

  return (
    <dl className="grid gap-2">
      {rows.map(([label, value]) => {
        const url =
          label === "Arkiv key" && value
            ? arkivExplorerEntityUrl(value)
            : label === "Tx hash" && value
              ? arkivExplorerTxUrl(value)
              : null;

        return (
          <div
            key={label}
            className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              {label}
            </dt>
            <dd className="flex min-w-0 items-center gap-2 font-mono text-xs text-slate-700">
              <span className="truncate">{truncateMiddle(value, 14, 8)}</span>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-slate-400 transition hover:text-[#4361ee]"
                  aria-label={`Open ${label} in Arkiv Explorer`}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
