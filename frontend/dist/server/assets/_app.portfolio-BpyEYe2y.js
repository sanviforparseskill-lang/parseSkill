import { T as useUpdatePortfolio, f as usePublishPortfolio, o as usePortfolio, s as useProfile, u as useProjects, x as useSkills } from "./queries-DP0lSQXe.js";
import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { t as colorForCategory } from "./category-colors-ClAVImTi.js";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
//#region src/routes/_app.portfolio.tsx?tsr-split=component
var THEMES = [
	"minimal",
	"terminal",
	"modern"
];
function PortfolioEditor() {
	const { data: profile } = useProfile();
	const { data: projects } = useProjects();
	const { data: skills } = useSkills();
	const { data: portfolio } = usePortfolio();
	const updatePortfolio = useUpdatePortfolio();
	const publishPortfolio = usePublishPortfolio();
	const [slug, setSlug] = useState("");
	const [theme, setTheme] = useState("terminal");
	useEffect(() => {
		if (portfolio) {
			setSlug(portfolio.slug ?? "");
			if (THEMES.includes(portfolio.theme)) setTheme(portfolio.theme);
		}
	}, [portfolio]);
	const published = portfolio?.is_public ?? false;
	const save = () => {
		updatePortfolio.mutate({
			slug,
			theme
		}, {
			onSuccess: () => toast.success("Portfolio updated"),
			onError: () => toast.error("Could not save portfolio")
		});
	};
	const togglePublish = () => {
		publishPortfolio.mutate(!published, {
			onSuccess: () => toast.success(!published ? "Published" : "Unpublished"),
			onError: () => toast.error("Could not update publish state")
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-baseline justify-between flex-wrap gap-3",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
				children: "portfolio editor"
			}), /* @__PURE__ */ jsx("h1", {
				className: "text-[28px] font-semibold mt-0.5",
				children: "Your public page"
			})] }), /* @__PURE__ */ jsxs(Link, {
				to: "/u/$username",
				params: { username: slug || profile?.github_handle || "" },
				className: "font-mono text-[12px] text-signal hover:underline inline-flex items-center gap-1",
				children: ["open live view ", /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3" })]
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-6",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "border border-line rounded-md bg-surface overflow-hidden",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "h-8 border-b border-line px-3 flex items-center font-mono text-[11px] text-ink-muted",
					children: ["parseskill.dev/@", slug || profile?.github_handle]
				}), /* @__PURE__ */ jsxs("div", {
					className: "p-6",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-4",
							children: [profile?.avatar_url ? /* @__PURE__ */ jsx("img", {
								src: profile.avatar_url,
								className: "w-16 h-16 rounded-full border border-line bg-secondary",
								alt: ""
							}) : /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full border border-line bg-secondary" }), /* @__PURE__ */ jsxs("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "text-[20px] font-semibold",
										children: profile?.display_name ?? profile?.github_handle
									}),
									/* @__PURE__ */ jsx("div", {
										className: "font-mono text-[12px] text-ink-muted",
										children: profile?.tagline
									}),
									/* @__PURE__ */ jsx("div", {
										className: "mt-1 inline-flex items-center gap-1 rounded border border-proof px-1.5 py-0.5 text-proof font-mono text-[10px] tracking-widest",
										children: "VERIFIED BY parseSkill();"
									})
								]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mt-6 mb-2",
							children: "top projects"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "grid sm:grid-cols-3 gap-2",
							children: (projects ?? []).slice(0, 3).map((p) => /* @__PURE__ */ jsxs("div", {
								className: "border border-line rounded p-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-mono text-[12px]",
									children: p.repo_full_name
								}), /* @__PURE__ */ jsx("div", {
									className: "text-[12px] text-ink-muted line-clamp-2",
									children: p.description
								})]
							}, p.id))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mt-6 mb-2",
							children: "skills"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "grid sm:grid-cols-2 gap-x-4 gap-y-1",
							children: (skills ?? []).slice(0, 8).map((s) => /* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-[100px_1fr] items-center gap-2 font-mono text-[11.5px]",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "flex items-center gap-1.5 truncate",
									children: [/* @__PURE__ */ jsx("span", {
										className: "w-1.5 h-1.5 rounded-sm",
										style: { background: colorForCategory(s.category) }
									}), s.name]
								}), /* @__PURE__ */ jsx(ConfidenceBar, {
									value: s.confidence,
									showLabel: false
								})]
							}, s.id))
						})
					]
				})]
			}), /* @__PURE__ */ jsxs("aside", {
				className: "border border-line rounded-md bg-surface p-5 space-y-6",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
						children: "visibility"
					}), /* @__PURE__ */ jsxs("label", {
						className: "flex items-center gap-2 font-mono text-[12px]",
						children: [/* @__PURE__ */ jsx("input", {
							type: "checkbox",
							checked: published,
							onChange: togglePublish,
							className: "accent-signal"
						}), "published (public URL is reachable)"]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
						children: "custom slug"
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center h-9 border border-line rounded bg-background overflow-hidden",
						children: [/* @__PURE__ */ jsx("span", {
							className: "px-2 font-mono text-[12px] text-ink-muted",
							children: "parseskill.dev/@"
						}), /* @__PURE__ */ jsx("input", {
							value: slug,
							onChange: (e) => setSlug(e.target.value),
							className: "flex-1 h-full bg-transparent font-mono text-[12.5px] outline-none pr-2"
						})]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
						children: "theme"
					}), /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-3 gap-2",
						children: THEMES.map((t) => /* @__PURE__ */ jsxs("button", {
							onClick: () => setTheme(t),
							className: `border rounded p-2 text-left font-mono text-[11.5px] capitalize ${theme === t ? "border-signal" : "border-line hover:border-signal/50"}`,
							children: [/* @__PURE__ */ jsx("div", {
								className: "h-8 rounded mb-1",
								style: { background: t === "minimal" ? "linear-gradient(90deg,#fff,#EEF0EC)" : t === "terminal" ? "linear-gradient(90deg,#14171B,#262B31)" : "linear-gradient(90deg,#F6F7F4,#3B6CE0)" }
							}), t]
						}, t))
					})] }),
					/* @__PURE__ */ jsx("button", {
						onClick: save,
						className: "w-full h-10 rounded bg-signal text-signal-foreground font-mono text-[12.5px] hover:opacity-90",
						children: "save changes"
					})
				]
			})]
		})]
	});
}
//#endregion
export { PortfolioEditor as component };
