import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { SourcePill } from "@/components/brand/SourcePill";
import { useChatHistory, useSendChatMessage } from "@/lib/queries";
import { sseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Citation = { label?: string; title?: string; items?: { label: string; value: string }[] };
type Msg = { role: "user" | "assistant"; content: string; citations?: Citation[] | null };

const SUGGESTIONS = [
  "Explain my strengths",
  "What should I learn next?",
  "Which of my projects best proves system design?",
];

export function ChatPanel({ embedded = false }: { embedded?: boolean }) {
  const { data: history } = useChatHistory();
  const sendMessage = useSendChatMessage();
  const [pending, setPending] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const messages: Msg[] = [
    ...((history ?? []).map((m) => ({ role: m.role, content: m.content, citations: m.citations as Citation[] | null }))),
    ...pending,
  ];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, streamedText]);
  useEffect(() => () => eventSourceRef.current?.close(), []);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    setPending((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setStreaming(true);
    setStreamedText("");
    try {
      const { message_id } = await sendMessage.mutateAsync(text);
      const es = new EventSource(sseUrl(`/chat/stream/${message_id}`), { withCredentials: true });
      eventSourceRef.current = es;
      let acc = "";
      es.addEventListener("token", (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as { token: string; done: boolean; citations?: Citation[] | null };
        acc += payload.token;
        setStreamedText(acc);
        if (payload.done) {
          setPending((m) => [...m, { role: "assistant", content: acc, citations: payload.citations }]);
          setStreaming(false);
          setStreamedText("");
          es.close();
        }
      });
      es.onerror = () => {
        es.close();
        setStreaming(false);
        setStreamedText("");
        toast.error("Assistant connection dropped");
      };
    } catch (err) {
      setStreaming(false);
      toast.error(err instanceof Error ? err.message : "Could not send message");
    }
  };

  return (
    <div className={cn("flex flex-col h-full", !embedded && "border border-line rounded-md bg-surface")}>
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && !streaming && (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">Ask about your evidence. Every answer cites the exact repos, files, and metrics.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="font-mono text-[11.5px] border border-line rounded px-2 py-1 hover:border-signal">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[90%] rounded-md px-3 py-2 text-[13.5px] leading-6",
              m.role === "user" ? "bg-signal text-signal-foreground" : "bg-secondary text-ink",
            )}>
              <p>{m.content}</p>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.citations.map((c, j) => (
                    <SourcePill key={j} label={c.label ?? "source"} receiptTitle={c.title ?? ""} items={c.items ?? []} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-md px-3 py-2 text-[13.5px] leading-6 bg-secondary text-ink">
              {streamedText}<span className="cursor-blink-forever">▍</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-line p-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your skills, projects, or fit…"
          className="flex-1 h-9 rounded bg-background border border-line px-3 font-mono text-[12.5px] outline-none focus:border-signal"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="h-9 px-3 rounded bg-signal text-signal-foreground font-mono text-[12px] disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="h-3.5 w-3.5" /> send
        </button>
      </form>
    </div>
  );
}
