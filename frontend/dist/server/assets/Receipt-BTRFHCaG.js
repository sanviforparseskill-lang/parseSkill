import { t as cn } from "./utils-C_uf36nf.js";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { CheckCircle2 } from "lucide-react";
//#region src/components/brand/Receipt.tsx
function Receipt({ title, items, stamp = "VERIFIED", className, children, animate = true }) {
	const [mounted, setMounted] = useState(!animate);
	useEffect(() => {
		if (animate) setMounted(true);
	}, [animate]);
	return /* @__PURE__ */ jsxs("div", {
		className: cn("relative bg-surface border border-line receipt-edge shadow-[0_1px_0_0_var(--color-line)] pt-4 pb-4 px-4", animate && mounted && "receipt-unfurl", className),
		style: { paddingTop: "18px" },
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-4 pb-3 border-b border-dashed border-line",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "Receipt"
					}), /* @__PURE__ */ jsx("h3", {
						className: "font-mono text-[13px] text-ink truncate mt-0.5",
						children: title
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "shrink-0 flex items-center gap-1 rounded border border-proof px-1.5 py-0.5 text-proof font-mono text-[10px] tracking-widest",
					children: [/* @__PURE__ */ jsx(CheckCircle2, {
						className: "h-3 w-3",
						strokeWidth: 2.5
					}), stamp]
				})]
			}),
			items && /* @__PURE__ */ jsx("ul", {
				className: "pt-3 space-y-1.5 font-mono text-[12px] text-ink",
				children: items.map((it, i) => /* @__PURE__ */ jsxs("li", {
					className: "flex items-baseline justify-between gap-4",
					children: [/* @__PURE__ */ jsx("span", {
						className: "text-ink-muted",
						children: it.label
					}), /* @__PURE__ */ jsx("span", {
						className: "text-right break-all",
						children: it.value
					})]
				}, i))
			}),
			children && /* @__PURE__ */ jsx("div", {
				className: "pt-3 text-[13px] text-ink",
				children
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 pt-3 border-t border-dashed border-line font-mono text-[10px] text-ink-muted flex justify-between",
				children: [/* @__PURE__ */ jsx("span", { children: "parseSkill();" }), /* @__PURE__ */ jsxs("span", { children: ["ts:", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)] })]
			})
		]
	});
}
//#endregion
export { Receipt as t };
