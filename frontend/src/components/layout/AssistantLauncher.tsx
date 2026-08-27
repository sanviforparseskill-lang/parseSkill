import { useState } from "react";
import { X } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { cn } from "@/lib/utils";

export function AssistantLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        className={cn(
          "fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 h-11 w-11 grid place-items-center rounded-md",
          "bg-ink text-background border border-ink hover:bg-signal hover:border-signal transition-colors font-mono",
        )}
      >
        <span className="text-lg leading-none cursor-blink-forever">_</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button aria-label="Close" onClick={() => setOpen(false)} className="flex-1 bg-black/30" />
          <aside className="w-full max-w-md h-full bg-surface border-l border-line flex flex-col">
            <div className="h-14 border-b border-line flex items-center justify-between px-4">
              <div className="font-mono text-[13px]">
                <span className="cursor-blink-forever">_</span> assistant
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:text-signal">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel embedded />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
