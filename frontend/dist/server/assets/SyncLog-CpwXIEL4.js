import { t as cn } from "./utils-C_uf36nf.js";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/brand/SyncLog.tsx
function SyncLog({ lines, speed = 220, done = false, className }) {
	const [shown, setShown] = useState([]);
	const timer = useRef(null);
	useEffect(() => {
		setShown([]);
		let i = 0;
		const tick = () => {
			setShown((s) => i < lines.length ? [...s, lines[i]] : s);
			i += 1;
			if (i <= lines.length) timer.current = window.setTimeout(tick, speed);
		};
		tick();
		return () => {
			if (timer.current) window.clearTimeout(timer.current);
		};
	}, [lines, speed]);
	return /* @__PURE__ */ jsxs("div", {
		className: cn("font-mono text-[12px] leading-6 bg-[color-mix(in_oklab,var(--ink)_92%,transparent)] text-[#E7EAE6] rounded-md border border-line p-3 overflow-auto scrollbar-thin", className),
		role: "log",
		"aria-live": "polite",
		children: [shown.map((l, i) => /* @__PURE__ */ jsxs("div", {
			className: "whitespace-pre",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "text-[color-mix(in_oklab,#E7EAE6_60%,transparent)]",
					children: l.t ?? (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour12: false })
				}),
				" ",
				/* @__PURE__ */ jsx("span", {
					className: cn(l.tone === "ok" && "text-proof", l.tone === "warn" && "text-gap", !l.tone && "text-[#E7EAE6]"),
					children: l.text
				})
			]
		}, i)), !done && shown.length >= lines.length ? null : /* @__PURE__ */ jsx("div", {
			className: "text-[color-mix(in_oklab,#E7EAE6_60%,transparent)]",
			children: /* @__PURE__ */ jsx("span", {
				className: "cursor-blink-forever",
				children: "▍"
			})
		})]
	});
}
//#endregion
export { SyncLog as t };
