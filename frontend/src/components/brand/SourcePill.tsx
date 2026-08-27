import { useState } from "react";
import { Receipt } from "./Receipt";
import { FileCode2 } from "lucide-react";

export function SourcePill({ label, receiptTitle, items }: {
  label: string; receiptTitle: string; items: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-block align-middle">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 font-mono text-[10.5px] px-1.5 py-0.5 rounded border border-line hover:border-proof text-ink-muted hover:text-ink transition-colors"
      >
        <FileCode2 className="h-3 w-3" />
        {label}
      </button>
      {open && (
        <span className="block mt-2 max-w-sm">
          <Receipt title={receiptTitle} items={items} />
        </span>
      )}
    </span>
  );
}
