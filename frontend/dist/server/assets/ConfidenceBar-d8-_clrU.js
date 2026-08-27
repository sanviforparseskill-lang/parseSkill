import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/brand/ConfidenceBar.tsx
function ConfidenceBar({ value, showLabel = true, size = "sm" }) {
	const pct = Math.round(value * 100);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2 min-w-0",
		children: [/* @__PURE__ */ jsx("div", {
			className: `relative flex-1 ${size === "md" ? "h-1.5" : "h-1"} bg-secondary rounded-full overflow-hidden`,
			children: /* @__PURE__ */ jsx("div", {
				className: "absolute inset-y-0 left-0 bg-proof rounded-full",
				style: { width: `${pct}%` }
			})
		}), showLabel && /* @__PURE__ */ jsxs("span", {
			className: "font-mono text-[11px] leading-none text-ink-muted tabular-nums w-9 text-right",
			children: [pct, "%"]
		})]
	});
}
//#endregion
export { ConfidenceBar as t };
