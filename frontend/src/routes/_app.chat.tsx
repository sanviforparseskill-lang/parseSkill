import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/chat/ChatPanel";

export const Route = createFileRoute("/_app/chat")({ component: ChatPage });

function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-24 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="mb-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">assistant</div>
        <h1 className="text-[28px] font-semibold mt-0.5">Ask anything about your evidence</h1>
      </div>
      <div className="flex-1 min-h-0">
        <ChatPanel />
      </div>
    </div>
  );
}
