import { r as apiOrigin } from "./api-CdQxeiZX.js";
import { t as Wordmark } from "./Wordmark-Cp1gduGQ.js";
import { ClientOnly, Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { Github } from "lucide-react";
import { createInternalNeonAuth } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
//#region src/lib/neonAuth.ts
var url = "https://ep-tiny-fire-az3m9zit.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth";
/** True once VITE_NEON_AUTH_URL is set — see frontend/.env. */
var isNeonAuthConfigured = Boolean(url);
createInternalNeonAuth(url, { adapter: BetterAuthReactAdapter() })?.adapter;
//#endregion
//#region src/routes/auth.signin.tsx?tsr-split=component
function SignIn() {
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background flex flex-col",
		children: [/* @__PURE__ */ jsx("header", {
			className: "h-14 border-b border-line px-6 flex items-center bg-surface",
			children: /* @__PURE__ */ jsx(Link, {
				to: "/",
				children: /* @__PURE__ */ jsx(Wordmark, { className: "text-[15px]" })
			})
		}), /* @__PURE__ */ jsx("div", {
			className: "flex-1 grid place-items-center px-4",
			children: /* @__PURE__ */ jsxs("div", {
				className: "w-full max-w-md border border-line bg-surface rounded-md p-8",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "sign in"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "mt-1 text-2xl font-semibold",
						children: "Continue with GitHub"
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-2 text-[13.5px] text-ink-muted leading-6",
						children: [
							"We request ",
							/* @__PURE__ */ jsx("span", {
								className: "font-mono text-ink",
								children: "read access to public repositories"
							}),
							" only. No writes, no private code, no email. You can revoke access from GitHub at any time."
						]
					}),
					/* @__PURE__ */ jsxs("a", {
						href: `${apiOrigin()}/auth/signin/github`,
						className: "mt-6 w-full h-11 rounded-md bg-signal text-signal-foreground font-medium hover:opacity-90 inline-flex items-center justify-center gap-2",
						children: [/* @__PURE__ */ jsx(Github, { className: "h-4 w-4" }), " Continue with GitHub"]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-6 border-t border-dashed border-line pt-4 font-mono text-[11px] text-ink-muted",
						children: ["scopes requested: ", /* @__PURE__ */ jsx("span", {
							className: "text-ink",
							children: "public_repo, read:user"
						})]
					}),
					isNeonAuthConfigured && /* @__PURE__ */ jsx("div", {
						className: "mt-6",
						children: /* @__PURE__ */ jsx(ClientOnly, {})
					})
				]
			})
		})]
	});
}
//#endregion
export { SignIn as component };
