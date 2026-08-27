import { t as Receipt } from "./Receipt-BTRFHCaG.js";
import { i as useGraphSkills, y as useSkillEvidence } from "./queries-DP0lSQXe.js";
import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { n as normalizeCategory, t as colorForCategory } from "./category-colors-ClAVImTi.js";
import { useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Download } from "lucide-react";
//#region src/routes/_app.graph.tsx?tsr-split=component
var cats = [
	"Backend",
	"Frontend",
	"ML/AI",
	"DevOps",
	"Database",
	"Language/Core"
];
var views = [
	{
		mode: "skill",
		label: "Skill"
	},
	{
		mode: "project",
		label: "Project"
	},
	{
		mode: "technology",
		label: "Technology"
	}
];
var nounForView = {
	skill: "skills",
	project: "projects",
	technology: "technologies"
};
function GraphPage() {
	const { data: graph } = useGraphSkills();
	const [view, setView] = useState("skill");
	const [minConf, setMinConf] = useState(0);
	const [activeCats, setActiveCats] = useState(cats);
	const [selectedId, setSelectedId] = useState(null);
	const viewNodes = useMemo(() => (graph?.nodes ?? []).filter((n) => n.data.type === view), [graph, view]);
	const hasCategories = view !== "project";
	const hasConfidence = view === "skill";
	const visible = useMemo(() => viewNodes.filter((n) => {
		const conf = n.data.confidence ?? .6;
		if (hasConfidence && conf < minConf) return false;
		if (hasCategories && !activeCats.includes(normalizeCategory(n.data.category))) return false;
		return true;
	}), [
		viewNodes,
		minConf,
		activeCats,
		hasCategories,
		hasConfidence
	]);
	const nodes = useMemo(() => {
		const byCategory = /* @__PURE__ */ new Map();
		for (const n of visible) {
			const cat = normalizeCategory(n.data.category);
			if (!byCategory.has(cat)) byCategory.set(cat, []);
			byCategory.get(cat).push(n);
		}
		const wedge = Math.PI * 2 / cats.length * .82;
		const placed = visible.map((n) => {
			const cat = normalizeCategory(n.data.category);
			const conf = n.data.confidence ?? .6;
			const siblings = byCategory.get(cat);
			const idxInCat = siblings.indexOf(n);
			const catAngle = cats.indexOf(cat) / cats.length * Math.PI * 2;
			const spread = siblings.length > 1 ? (idxInCat / (siblings.length - 1) - .5) * wedge : 0;
			const band = idxInCat % 3;
			const r = 85 + (1 - conf) * 110 + band * 45;
			return {
				id: n.data.id,
				name: n.data.label,
				category: cat,
				confidence: conf,
				x: 400 + Math.cos(catAngle + spread) * r,
				y: 300 + Math.sin(catAngle + spread) * r,
				radius: 6 + conf * 14
			};
		});
		for (let iter = 0; iter < 200; iter++) {
			let moved = false;
			for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
				const a = placed[i];
				const b = placed[j];
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const dist = Math.hypot(dx, dy) || .01;
				const minDist = a.radius + b.radius + 34;
				if (dist < minDist) {
					moved = true;
					const push = (minDist - dist) / 2;
					const ux = dx / dist;
					const uy = dy / dist;
					a.x -= ux * push;
					a.y -= uy * push;
					b.x += ux * push;
					b.y += uy * push;
				}
			}
			if (!moved) break;
		}
		for (const p of placed) {
			p.x = Math.min(760, Math.max(40, p.x));
			p.y = Math.min(560, Math.max(40, p.y));
		}
		return placed;
	}, [visible]);
	const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0] ?? null;
	const { data: evidence } = useSkillEvidence(selected?.id.startsWith("skill:") ? selected.id.slice(6) : null);
	const nodeLabelById = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		for (const n of graph?.nodes ?? []) m.set(n.data.id, n.data.label);
		return m;
	}, [graph]);
	const relatedNodes = useMemo(() => {
		if (!selected || view === "skill") return [];
		return (graph?.edges ?? []).filter((e) => e.data.source === selected.id || e.data.target === selected.id).map((e) => {
			const otherId = e.data.source === selected.id ? e.data.target : e.data.source;
			return {
				id: otherId,
				label: nodeLabelById.get(otherId) ?? otherId,
				weight: e.data.weight
			};
		}).sort((a, b) => b.weight - a.weight);
	}, [
		graph,
		selected,
		view,
		nodeLabelById
	]);
	const setViewMode = (mode) => {
		setView(mode);
		setSelectedId(null);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "h-[calc(100vh-3.5rem)] flex flex-col",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "h-12 border-b border-line px-4 flex items-center gap-4 bg-surface",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "skill graph"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex items-center gap-1 border border-line rounded font-mono text-[11px]",
					children: views.map(({ mode, label }) => /* @__PURE__ */ jsxs("button", {
						onClick: () => setViewMode(mode),
						className: `px-2 py-1 ${view === mode ? "bg-signal text-signal-foreground" : "text-ink-muted hover:text-ink"}`,
						children: [label, "-centric"]
					}, mode))
				}),
				/* @__PURE__ */ jsxs("button", {
					className: "h-8 px-2 border border-line rounded font-mono text-[11px] hover:border-signal inline-flex items-center gap-1 ml-auto",
					children: [/* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" }), " export"]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex-1 min-h-0 grid grid-cols-[220px_1fr_320px]",
			children: [
				/* @__PURE__ */ jsxs("aside", {
					className: "border-r border-line p-4 space-y-5 overflow-auto bg-surface",
					children: [
						hasCategories && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
							children: "category"
						}), /* @__PURE__ */ jsx("div", {
							className: "space-y-1",
							children: cats.map((c) => /* @__PURE__ */ jsxs("label", {
								className: "flex items-center gap-2 font-mono text-[12px] cursor-pointer",
								children: [
									/* @__PURE__ */ jsx("input", {
										type: "checkbox",
										checked: activeCats.includes(c),
										onChange: () => setActiveCats((s) => s.includes(c) ? s.filter((x) => x !== c) : [...s, c]),
										className: "accent-signal"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "w-2 h-2 rounded-sm",
										style: { background: colorForCategory(c) }
									}),
									/* @__PURE__ */ jsx("span", { children: c })
								]
							}, c))
						})] }),
						hasConfidence && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
							children: [
								"min confidence · ",
								Math.round(minConf * 100),
								"%"
							]
						}), /* @__PURE__ */ jsx("input", {
							type: "range",
							min: 0,
							max: 100,
							value: minConf * 100,
							onChange: (e) => setMinConf(Number(e.target.value) / 100),
							className: "w-full accent-signal"
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "font-mono text-[11px] text-ink-muted border-t border-line pt-3",
							children: [
								"showing ",
								visible.length,
								" of ",
								viewNodes.length,
								" ",
								nounForView[view]
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative overflow-hidden bg-background",
					children: [/* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 800 600",
						className: "w-full h-full",
						children: [nodes.map((n) => nodes.filter((m) => m.id !== n.id && m.category === n.category).slice(0, 2).map((m) => /* @__PURE__ */ jsx("line", {
							x1: n.x,
							y1: n.y,
							x2: m.x,
							y2: m.y,
							stroke: "var(--line)",
							strokeWidth: "0.7"
						}, `${n.id}-${m.id}`))), nodes.map((n) => /* @__PURE__ */ jsxs("g", {
							onClick: () => setSelectedId(n.id),
							className: "cursor-pointer",
							children: [/* @__PURE__ */ jsx("circle", {
								cx: n.x,
								cy: n.y,
								r: n.radius,
								fill: colorForCategory(n.category),
								opacity: selectedId === n.id ? 1 : .85,
								stroke: selectedId === n.id ? "var(--proof)" : "transparent",
								strokeWidth: "2"
							}), /* @__PURE__ */ jsx("text", {
								x: n.x,
								y: n.y + n.radius + 12,
								textAnchor: "middle",
								fontFamily: "var(--font-mono)",
								fontSize: "10",
								fill: "var(--ink)",
								children: n.name
							})]
						}, n.id))]
					}), nodes.length === 0 && /* @__PURE__ */ jsxs("div", {
						className: "absolute inset-0 grid place-items-center text-[13px] text-ink-muted",
						children: [
							"No ",
							nounForView[view],
							" to graph yet — sync your profile first."
						]
					})]
				}),
				/* @__PURE__ */ jsx("aside", {
					className: "border-l border-line p-4 overflow-auto bg-surface",
					children: selected ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "selected node"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "mt-1 text-lg font-semibold",
							children: selected.name
						}),
						view === "skill" ? /* @__PURE__ */ jsxs(Fragment, { children: [
							/* @__PURE__ */ jsx("div", {
								className: "mt-1 font-mono text-[11px] text-ink-muted",
								children: selected.category
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-3",
								children: /* @__PURE__ */ jsx(ConfidenceBar, {
									value: selected.confidence,
									size: "md"
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-4",
								children: [/* @__PURE__ */ jsx(Receipt, {
									title: `${selected.name} · confidence ${selected.confidence.toFixed(2)}`,
									items: [
										{
											label: "breadth",
											value: evidence ? evidence.breadth.toFixed(2) : "…"
										},
										{
											label: "depth",
											value: evidence ? evidence.depth.toFixed(2) : "…"
										},
										{
											label: "recency",
											value: evidence ? evidence.recency.toFixed(2) : "…"
										},
										{
											label: "category",
											value: selected.category
										}
									]
								}, selected.id), evidence && evidence.evidence_repos.length > 0 && /* @__PURE__ */ jsxs("div", {
									className: "mt-4",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
										children: "evidence repos"
									}), /* @__PURE__ */ jsx("ul", {
										className: "space-y-1 font-mono text-[12px]",
										children: evidence.evidence_repos.map((e) => /* @__PURE__ */ jsxs("li", {
											className: "border border-line rounded p-2",
											children: [/* @__PURE__ */ jsx("div", {
												className: "text-ink",
												children: e.repo_full_name
											}), /* @__PURE__ */ jsx("div", {
												className: "text-ink-muted",
												children: e.technologies.join(", ")
											})]
										}, e.project_id))
									})]
								})]
							})
						] }) : /* @__PURE__ */ jsxs("div", {
							className: "mt-4",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
								children: view === "technology" ? "used by / maps to" : "technologies used"
							}), relatedNodes.length > 0 ? /* @__PURE__ */ jsx("ul", {
								className: "space-y-1 font-mono text-[12px]",
								children: relatedNodes.map((r) => /* @__PURE__ */ jsxs("li", {
									className: "border border-line rounded p-2 flex items-center justify-between",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-ink",
										children: r.label
									}), /* @__PURE__ */ jsx("span", {
										className: "text-ink-muted",
										children: r.weight.toFixed(2)
									})]
								}, r.id))
							}) : /* @__PURE__ */ jsx("div", {
								className: "font-mono text-[12px] text-ink-muted",
								children: "No connections found."
							})]
						})
					] }) : /* @__PURE__ */ jsx("div", {
						className: "font-mono text-[12px] text-ink-muted",
						children: "Select a node to see its evidence."
					})
				})
			]
		})]
	});
}
//#endregion
export { GraphPage as component };
