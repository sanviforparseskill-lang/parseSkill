import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/brand/RoleFitCard.tsx
function RoleFitCard({ role, strengths = [], gaps = [], size = "md" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "bg-surface border border-line rounded-md p-4 hover:border-signal transition-colors",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsx("div", {
					className: "min-w-0",
					children: /* @__PURE__ */ jsx("h3", {
						className: size === "lg" ? "text-lg font-semibold" : "text-base font-semibold",
						children: role.role_name
					})
				}), /* @__PURE__ */ jsxs("span", {
					className: "font-mono text-lg font-bold text-proof tabular-nums",
					children: [Math.round(role.confidence * 100), "%"]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-2",
				children: /* @__PURE__ */ jsx(ConfidenceBar, {
					value: role.confidence,
					showLabel: false,
					size: "md"
				})
			}),
			size !== "sm" && role.description && /* @__PURE__ */ jsx("p", {
				className: "text-[13px] text-ink-muted mt-3",
				children: role.description
			}),
			(strengths.length > 0 || gaps.length > 0) && /* @__PURE__ */ jsxs("div", {
				className: "mt-3 space-y-2",
				children: [strengths.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1",
					children: "Strengths"
				}), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-1",
					children: strengths.map((s) => /* @__PURE__ */ jsx("span", {
						className: "font-mono text-[11px] px-1.5 py-0.5 rounded border border-proof/40 text-proof",
						children: s
					}, s))
				})] }), gaps.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1",
					children: "Gaps"
				}), /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap gap-1",
					children: gaps.map((s) => /* @__PURE__ */ jsx("span", {
						className: "font-mono text-[11px] px-1.5 py-0.5 rounded border border-gap/40 text-gap",
						children: s
					}, s))
				})] })]
			})
		]
	});
}
//#endregion
export { RoleFitCard as t };
