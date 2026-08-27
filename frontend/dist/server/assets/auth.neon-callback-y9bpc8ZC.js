import { ClientOnly } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/auth.neon-callback.tsx?tsr-split=component
/**
* Where Neon Auth's OAuth (Google) flow lands back after the provider
* redirect. Exchanges the now-active Neon Auth session for our own
* ps_access cookie, then continues into the app — see
* components/auth/NeonAuthPanel.tsx.
*/
function NeonAuthCallback() {
	return /* @__PURE__ */ jsx(ClientOnly, { fallback: /* @__PURE__ */ jsx(Loading, {}) });
}
function Loading() {
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen grid place-items-center bg-background",
		children: /* @__PURE__ */ jsxs("div", {
			className: "font-mono text-[12px] text-ink-muted",
			children: [/* @__PURE__ */ jsx("span", {
				className: "cursor-blink-forever",
				children: "_"
			}), " loading"]
		})
	});
}
//#endregion
export { NeonAuthCallback as component };
