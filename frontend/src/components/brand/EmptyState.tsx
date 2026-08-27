import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-line rounded-md p-8 text-center bg-surface">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="text-sm text-ink-muted mt-1 max-w-md mx-auto">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
