import { t as cn } from "./utils-C_uf36nf.js";
import { t as Receipt } from "./Receipt-BTRFHCaG.js";
import { i as sseUrl } from "./api-CdQxeiZX.js";
import { _ as useSendChatMessage, t as useChatHistory } from "./queries-DP0lSQXe.js";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { FileCode2, Send } from "lucide-react";
//#region src/components/brand/SourcePill.tsx
function SourcePill({ label, receiptTitle, items }) {
	const [open, setOpen] = useState(false);
	return /* @__PURE__ */ jsxs("span", {
		className: "inline-block align-middle",
		children: [/* @__PURE__ */ jsxs("button", {
			onClick: () => setOpen((o) => !o),
			className: "inline-flex items-center gap-1 font-mono text-[10.5px] px-1.5 py-0.5 rounded border border-line hover:border-proof text-ink-muted hover:text-ink transition-colors",
			children: [/* @__PURE__ */ jsx(FileCode2, { className: "h-3 w-3" }), label]
		}), open && /* @__PURE__ */ jsx("span", {
			className: "block mt-2 max-w-sm",
			children: /* @__PURE__ */ jsx(Receipt, {
				title: receiptTitle,
				items
			})
		})]
	});
}
//#endregion
//#region src/components/chat/ChatPanel.tsx
var SUGGESTIONS = [
	"Explain my strengths",
	"What should I learn next?",
	"Which of my projects best proves system design?"
];
function ChatPanel({ embedded = false }) {
	const { data: history } = useChatHistory();
	const sendMessage = useSendChatMessage();
	const [pending, setPending] = useState([]);
	const [input, setInput] = useState("");
	const [streaming, setStreaming] = useState(false);
	const [streamedText, setStreamedText] = useState("");
	const bottomRef = useRef(null);
	const eventSourceRef = useRef(null);
	const messages = [...(history ?? []).map((m) => ({
		role: m.role,
		content: m.content,
		citations: m.citations
	})), ...pending];
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, streamedText]);
	useEffect(() => () => eventSourceRef.current?.close(), []);
	const send = async (text) => {
		if (!text.trim() || streaming) return;
		setPending((m) => [...m, {
			role: "user",
			content: text
		}]);
		setInput("");
		setStreaming(true);
		setStreamedText("");
		try {
			const { message_id } = await sendMessage.mutateAsync(text);
			const es = new EventSource(sseUrl(`/chat/stream/${message_id}`), { withCredentials: true });
			eventSourceRef.current = es;
			let acc = "";
			es.addEventListener("token", (evt) => {
				const payload = JSON.parse(evt.data);
				acc += payload.token;
				setStreamedText(acc);
				if (payload.done) {
					setPending((m) => [...m, {
						role: "assistant",
						content: acc,
						citations: payload.citations
					}]);
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
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex flex-col h-full", !embedded && "border border-line rounded-md bg-surface"),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex-1 min-h-0 overflow-auto p-4 space-y-4 scrollbar-thin",
			children: [
				messages.length === 0 && !streaming && /* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm text-ink-muted",
						children: "Ask about your evidence. Every answer cites the exact repos, files, and metrics."
					}), /* @__PURE__ */ jsx("div", {
						className: "flex flex-wrap gap-2",
						children: SUGGESTIONS.map((s) => /* @__PURE__ */ jsx("button", {
							onClick: () => send(s),
							className: "font-mono text-[11.5px] border border-line rounded px-2 py-1 hover:border-signal",
							children: s
						}, s))
					})]
				}),
				messages.map((m, i) => /* @__PURE__ */ jsx("div", {
					className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"),
					children: /* @__PURE__ */ jsxs("div", {
						className: cn("max-w-[90%] rounded-md px-3 py-2 text-[13.5px] leading-6", m.role === "user" ? "bg-signal text-signal-foreground" : "bg-secondary text-ink"),
						children: [/* @__PURE__ */ jsx("p", { children: m.content }), m.citations && m.citations.length > 0 && /* @__PURE__ */ jsx("div", {
							className: "mt-2 flex flex-wrap gap-1.5",
							children: m.citations.map((c, j) => /* @__PURE__ */ jsx(SourcePill, {
								label: c.label ?? "source",
								receiptTitle: c.title ?? "",
								items: c.items ?? []
							}, j))
						})]
					})
				}, i)),
				streaming && /* @__PURE__ */ jsx("div", {
					className: "flex justify-start",
					children: /* @__PURE__ */ jsxs("div", {
						className: "max-w-[90%] rounded-md px-3 py-2 text-[13.5px] leading-6 bg-secondary text-ink",
						children: [streamedText, /* @__PURE__ */ jsx("span", {
							className: "cursor-blink-forever",
							children: "▍"
						})]
					})
				}),
				/* @__PURE__ */ jsx("div", { ref: bottomRef })
			]
		}), /* @__PURE__ */ jsxs("form", {
			onSubmit: (e) => {
				e.preventDefault();
				send(input);
			},
			className: "border-t border-line p-3 flex items-center gap-2",
			children: [/* @__PURE__ */ jsx("input", {
				value: input,
				onChange: (e) => setInput(e.target.value),
				placeholder: "Ask about your skills, projects, or fit…",
				className: "flex-1 h-9 rounded bg-background border border-line px-3 font-mono text-[12.5px] outline-none focus:border-signal"
			}), /* @__PURE__ */ jsxs("button", {
				type: "submit",
				disabled: streaming || !input.trim(),
				className: "h-9 px-3 rounded bg-signal text-signal-foreground font-mono text-[12px] disabled:opacity-50 flex items-center gap-1",
				children: [/* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" }), " send"]
			})]
		})]
	});
}
//#endregion
export { ChatPanel as t };
