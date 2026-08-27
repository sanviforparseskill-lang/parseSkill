import { t as Route } from "./u._username-B3oAgqVg.js";
import { d as usePublicPortfolio } from "./queries-DP0lSQXe.js";
import { t as Wordmark } from "./Wordmark-Cp1gduGQ.js";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/u.$username.tsx?tsr-split=component
function Public() {
	const { username } = Route.useParams();
	const { data: portfolio, isLoading, isError } = usePublicPortfolio(username);
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background text-ink",
		children: [/* @__PURE__ */ jsxs("header", {
			className: "h-14 border-b border-line px-6 flex items-center justify-between bg-surface",
			children: [/* @__PURE__ */ jsx(Link, {
				to: "/",
				children: /* @__PURE__ */ jsx(Wordmark, { className: "text-[13px]" })
			}), /* @__PURE__ */ jsx(Link, {
				to: "/auth/signin",
				className: "font-mono text-[12px] text-signal hover:underline",
				children: "make yours →"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "max-w-4xl mx-auto px-6 py-16",
			children: [
				isLoading && /* @__PURE__ */ jsx("p", {
					className: "text-[13.5px] text-ink-muted",
					children: "Loading…"
				}),
				isError && /* @__PURE__ */ jsxs("p", {
					className: "text-[13.5px] text-ink-muted",
					children: [
						"This portfolio isn't public, or @",
						username,
						" hasn't published one yet."
					]
				}),
				portfolio && /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-5",
						children: [portfolio.avatar_url ? /* @__PURE__ */ jsx("img", {
							src: portfolio.avatar_url,
							className: "w-20 h-20 rounded-full border border-line bg-secondary",
							alt: ""
						}) : /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full border border-line bg-secondary" }), /* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ jsx("h1", {
									className: "text-[32px] font-semibold leading-tight",
									children: portfolio.display_name ?? portfolio.handle
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-[15px] text-ink-muted",
									children: portfolio.tagline
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "mt-2 flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "inline-flex items-center gap-1 rounded border border-proof px-2 py-0.5 text-proof font-mono text-[10.5px] tracking-widest",
										children: "✓ VERIFIED BY parseSkill();"
									}), /* @__PURE__ */ jsxs("span", {
										className: "font-mono text-[11px] text-ink-muted",
										children: ["@", portfolio.handle]
									})]
								})
							]
						})]
					}),
					portfolio.top_projects.length > 0 && /* @__PURE__ */ jsxs("section", {
						className: "mt-12",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "top projects"
						}), /* @__PURE__ */ jsx("div", {
							className: "mt-3 grid sm:grid-cols-3 gap-3",
							children: portfolio.top_projects.map((p) => /* @__PURE__ */ jsxs("div", {
								className: "border border-line rounded-md p-4 bg-surface",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-mono text-[12.5px] font-semibold",
									children: p.repo_full_name
								}), /* @__PURE__ */ jsx("p", {
									className: "text-[13px] text-ink-muted mt-1 line-clamp-3",
									children: p.description
								})]
							}, p.repo_full_name))
						})]
					}),
					portfolio.top_role && /* @__PURE__ */ jsxs("section", {
						className: "mt-12",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "career fit"
						}), /* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-[15px] leading-7",
							children: [
								"Strongest fit for ",
								/* @__PURE__ */ jsx("span", {
									className: "font-semibold",
									children: portfolio.top_role.role_name
								}),
								" (",
								Math.round(portfolio.top_role.confidence * 100),
								"%)."
							]
						})]
					}),
					/* @__PURE__ */ jsx("section", {
						className: "mt-12 pt-8 border-t border-line flex flex-wrap items-center justify-between gap-3",
						children: /* @__PURE__ */ jsxs("div", {
							className: "font-mono text-[12px] text-ink-muted",
							children: ["github.com/", portfolio.handle]
						})
					})
				] })
			]
		})]
	});
}
//#endregion
export { Public as component };
