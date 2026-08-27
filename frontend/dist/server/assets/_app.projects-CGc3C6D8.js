import { t as Receipt } from "./Receipt-BTRFHCaG.js";
import { c as useProject, u as useProjects } from "./queries-DP0lSQXe.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { GitFork, Star, X } from "lucide-react";
//#region src/routes/_app.projects.tsx?tsr-split=component
function ProjectsPage() {
	const { data: projects } = useProjects();
	const [q, setQ] = useState("");
	const [sort, setSort] = useState("complexity");
	const [openId, setOpenId] = useState(null);
	const { data: openProject } = useProject(openId);
	const list = useMemo(() => projects ?? [], [projects]);
	const filtered = useMemo(() => {
		let l = list.filter((p) => p.repo_full_name.toLowerCase().includes(q.toLowerCase()));
		if (sort === "complexity") l = [...l].sort((a, b) => (b.complexity_score ?? 0) - (a.complexity_score ?? 0));
		if (sort === "stars") l = [...l].sort((a, b) => b.stars - a.stars);
		if (sort === "recent") l = [...l].sort((a, b) => new Date(b.last_commit_at ?? 0).getTime() - new Date(a.last_commit_at ?? 0).getTime());
		return l;
	}, [
		list,
		q,
		sort
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "projects"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "text-[28px] font-semibold mt-0.5",
					children: "Analyzed repositories"
				}),
				/* @__PURE__ */ jsxs("p", {
					className: "text-[14px] text-ink-muted mt-1",
					children: [list.length, " non-fork repositories, ranked by evidence weight."]
				})
			] }),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 flex flex-wrap items-center gap-2 border border-line rounded-md p-2 bg-surface",
				children: [
					/* @__PURE__ */ jsx("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "search projects…",
						className: "h-9 rounded border border-line bg-background px-3 font-mono text-[12px] w-56 focus:border-signal outline-none"
					}),
					/* @__PURE__ */ jsxs("select", {
						value: sort,
						onChange: (e) => setSort(e.target.value),
						className: "h-9 rounded border border-line bg-background px-2 font-mono text-[12px]",
						children: [
							/* @__PURE__ */ jsx("option", {
								value: "complexity",
								children: "sort: complexity"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "recent",
								children: "sort: recent"
							}),
							/* @__PURE__ */ jsx("option", {
								value: "stars",
								children: "sort: stars"
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "ml-auto font-mono text-[11px] text-ink-muted",
						children: [filtered.length, " results"]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4",
				children: [filtered.map((p) => /* @__PURE__ */ jsxs("button", {
					onClick: () => setOpenId(p.id),
					className: "text-left bg-surface border border-line rounded-md p-4 hover:border-signal transition-colors",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-baseline justify-between gap-2",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[13px] font-semibold truncate",
								children: p.repo_full_name
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 font-mono text-[11px] text-ink-muted shrink-0",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "inline-flex items-center gap-0.5",
									children: [
										/* @__PURE__ */ jsx(Star, { className: "h-3 w-3" }),
										" ",
										p.stars
									]
								}), p.is_fork && /* @__PURE__ */ jsx(GitFork, { className: "h-3 w-3" })]
							})]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-[12.5px] text-ink-muted mt-1 line-clamp-2",
							children: p.description
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between font-mono text-[10.5px] text-ink-muted mb-1",
								children: [/* @__PURE__ */ jsx("span", { children: "complexity" }), /* @__PURE__ */ jsxs("span", { children: [Math.round(p.complexity_score ?? 0), "/100"] })]
							}), /* @__PURE__ */ jsx("div", {
								className: "h-1 bg-secondary rounded-full overflow-hidden",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full bg-signal",
									style: { width: `${p.complexity_score ?? 0}%` }
								})
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 flex flex-wrap gap-1",
							children: p.top_technologies.slice(0, 4).map((t) => /* @__PURE__ */ jsx("span", {
								className: "font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-secondary/60",
								children: t
							}, t))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-3 flex items-center justify-between font-mono text-[10.5px] text-ink-muted",
							children: [/* @__PURE__ */ jsxs("span", { children: [
								"ownership ",
								p.contribution_weight != null ? Math.round(p.contribution_weight * 100) : "—",
								"%"
							] }), /* @__PURE__ */ jsx("span", { children: p.last_commit_at ? new Date(p.last_commit_at).toLocaleDateString() : "" })]
						})
					]
				}, p.id)), list.length === 0 && /* @__PURE__ */ jsx("div", {
					className: "col-span-full text-center text-[13.5px] text-ink-muted py-12",
					children: "No projects analyzed yet — sync your profile from the dashboard."
				})]
			}),
			openId && /* @__PURE__ */ jsx("div", {
				className: "fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-auto",
				onClick: () => setOpenId(null),
				children: /* @__PURE__ */ jsxs("div", {
					className: "w-full max-w-3xl bg-surface border border-line rounded-md mt-10",
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between p-4 border-b border-line",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "project"
						}), /* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold",
							children: openProject?.repo_full_name ?? "…"
						})] }), /* @__PURE__ */ jsx("button", {
							onClick: () => setOpenId(null),
							className: "p-1",
							children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
						})]
					}), openProject && /* @__PURE__ */ jsxs("div", {
						className: "p-4 grid md:grid-cols-2 gap-6",
						children: [/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("p", {
								className: "text-[14px]",
								children: openProject.description
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-mono text-[11px] uppercase text-ink-muted",
									children: "detected technologies"
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-2 flex flex-wrap gap-1.5",
									children: openProject.technologies.map((t) => /* @__PURE__ */ jsx("span", {
										className: "font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-secondary/60",
										children: t.name
									}, t.name))
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-mono text-[11px] uppercase text-ink-muted",
									children: "architecture patterns"
								}), /* @__PURE__ */ jsx("ul", {
									className: "mt-1 font-mono text-[12.5px] list-disc pl-4 space-y-0.5",
									children: openProject.architecture_patterns.map((p) => /* @__PURE__ */ jsx("li", { children: p }, p))
								})]
							}),
							openProject.readme_excerpt && /* @__PURE__ */ jsxs("div", {
								className: "mt-4",
								children: [/* @__PURE__ */ jsx("div", {
									className: "font-mono text-[11px] uppercase text-ink-muted",
									children: "readme excerpt"
								}), /* @__PURE__ */ jsx("p", {
									className: "mt-1 text-[13px] text-ink-muted leading-6",
									children: openProject.readme_excerpt
								})]
							})
						] }), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Receipt, {
							title: `${openProject.repo_full_name} · complexity ${Math.round(openProject.complexity_score ?? 0)}`,
							items: [
								{
									label: "patterns",
									value: `${openProject.architecture_patterns.length} detected`
								},
								{
									label: "concepts",
									value: `${openProject.concepts_demonstrated.length} demonstrated`
								},
								{
									label: "ownership",
									value: `${openProject.contribution_weight != null ? Math.round(openProject.contribution_weight * 100) : "—"}%`
								},
								{
									label: "language",
									value: openProject.primary_language ?? "—"
								},
								{
									label: "stars",
									value: `${openProject.stars}`
								},
								{
									label: "forks",
									value: `${openProject.forks}`
								}
							]
						}) })]
					})]
				})
			})
		]
	});
}
//#endregion
export { ProjectsPage as component };
