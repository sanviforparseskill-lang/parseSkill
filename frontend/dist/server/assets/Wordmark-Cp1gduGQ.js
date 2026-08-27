import { t as cn } from "./utils-C_uf36nf.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/brand/Wordmark.tsx
function Wordmark({ className, blink = false }) {
	return /* @__PURE__ */ jsxs("span", {
		className: cn("font-display font-bold tracking-tight text-ink", className),
		style: { fontFamily: "var(--font-display)" },
		"aria-label": "parseSkill();",
		children: ["parseSkill()", /* @__PURE__ */ jsx("span", {
			className: cn("text-signal", blink && "cursor-blink"),
			children: ";"
		})]
	});
}
//#endregion
export { Wordmark as t };
