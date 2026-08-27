import { t as ChatPanel } from "./ChatPanel-BxLtNBzb.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/_app.chat.tsx?tsr-split=component
function ChatPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-4xl mx-auto px-6 py-8 pb-24 h-[calc(100vh-3.5rem)] flex flex-col",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4",
			children: [/* @__PURE__ */ jsx("div", {
				className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
				children: "assistant"
			}), /* @__PURE__ */ jsx("h1", {
				className: "text-[28px] font-semibold mt-0.5",
				children: "Ask anything about your evidence"
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "flex-1 min-h-0",
			children: /* @__PURE__ */ jsx(ChatPanel, {})
		})]
	});
}
//#endregion
export { ChatPage as component };
