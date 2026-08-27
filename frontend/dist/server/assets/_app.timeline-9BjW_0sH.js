import { S as useTimeline } from "./queries-DP0lSQXe.js";
import { t as colorForCategory } from "./category-colors-ClAVImTi.js";
import { useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/_app.timeline.tsx?tsr-split=component
function TimelinePage() {
	const { data } = useTimeline();
	const cells = useMemo(() => data?.cells ?? [], [data]);
	const milestones = data?.milestones ?? [];
	const velocity = data?.learning_velocity ?? [];
	const quarters = useMemo(() => Array.from(new Set(cells.map((c) => c.quarter))).sort(), [cells]);
	const rows = useMemo(() => {
		const maxCommits = Math.max(1, ...cells.map((c) => c.commit_count));
		const byTech = /* @__PURE__ */ new Map();
		for (const c of cells) {
			if (!byTech.has(c.technology_id)) byTech.set(c.technology_id, {
				name: c.technology_name,
				category: c.category,
				byQuarter: /* @__PURE__ */ new Map()
			});
			byTech.get(c.technology_id).byQuarter.set(c.quarter, c.commit_count);
		}
		return Array.from(byTech.values()).map((t) => ({
			name: t.name,
			category: t.category,
			cells: quarters.map((q) => {
				const count = t.byQuarter.get(q) ?? 0;
				return count === 0 ? 0 : Math.min(4, 1 + Math.round(count / maxCommits * 3));
			})
		}));
	}, [cells, quarters]);
	const maxV = Math.max(1, ...velocity.map((v) => v.new_technologies));
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex items-baseline justify-between flex-wrap gap-3",
				children: /* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "evolution timeline"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-[28px] font-semibold mt-0.5",
						children: "How your skills grew over time"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-[14px] text-ink-muted mt-1",
						children: "Every cell is a quarter of commits, colored by category."
					})
				] })
			}),
			velocity.length > 0 && /* @__PURE__ */ jsxs("div", {
				className: "mt-6 border border-line rounded-md bg-surface p-5",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2",
						children: "learning velocity · technologies adopted per quarter"
					}),
					/* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 600 120",
						className: "w-full h-28",
						children: [/* @__PURE__ */ jsx("polyline", {
							fill: "none",
							stroke: "var(--signal)",
							strokeWidth: "1.5",
							vectorEffect: "non-scaling-stroke",
							points: velocity.map((v, i) => `${i / Math.max(velocity.length - 1, 1) * 600},${110 - v.new_technologies / maxV * 100}`).join(" ")
						}), velocity.map((v, i) => /* @__PURE__ */ jsx("circle", {
							cx: i / Math.max(velocity.length - 1, 1) * 600,
							cy: 110 - v.new_technologies / maxV * 100,
							r: "2",
							fill: "var(--signal)"
						}, v.quarter))]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "grid font-mono text-[10px] text-ink-muted mt-1",
						style: { gridTemplateColumns: `repeat(${velocity.length}, minmax(0, 1fr))` },
						children: velocity.map((v) => /* @__PURE__ */ jsx("div", {
							className: "text-center",
							children: v.quarter
						}, v.quarter))
					})
				]
			}),
			rows.length > 0 ? /* @__PURE__ */ jsx("div", {
				className: "mt-8 border border-line rounded-md bg-surface p-5 overflow-x-auto",
				children: /* @__PURE__ */ jsxs("div", {
					className: "min-w-[820px]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "grid",
						style: { gridTemplateColumns: `160px repeat(${quarters.length}, minmax(38px, 1fr))` },
						children: [
							/* @__PURE__ */ jsx("div", {}),
							quarters.map((q) => /* @__PURE__ */ jsx("div", {
								className: "font-mono text-[10px] text-ink-muted text-center",
								children: q
							}, q)),
							rows.map((row) => /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
								className: "font-mono text-[11.5px] py-1.5 flex items-center gap-2 pr-3",
								children: [/* @__PURE__ */ jsx("span", {
									className: "w-2 h-2 rounded-sm",
									style: { background: colorForCategory(row.category) }
								}), /* @__PURE__ */ jsx("span", {
									className: "truncate",
									children: row.name
								})]
							}, row.name), row.cells.map((c, i) => /* @__PURE__ */ jsx("div", {
								title: `${row.name} · ${quarters[i]} · intensity ${c}/4`,
								className: "h-6 mx-0.5 my-0.5 rounded-sm",
								style: { background: c === 0 ? "var(--secondary)" : `color-mix(in oklab, ${colorForCategory(row.category)} ${25 + c * 18}%, transparent)` }
							}, `${row.name}-${i}`))] }))
						]
					}), milestones.length > 0 && /* @__PURE__ */ jsx("div", {
						className: "mt-3 font-mono text-[10.5px] text-ink-muted flex flex-wrap gap-4",
						children: milestones.map((m) => /* @__PURE__ */ jsxs("span", { children: [
							"◆ ",
							m.date.slice(0, 10),
							" — ",
							m.label
						] }, `${m.technology_id}-${m.date}`))
					})]
				})
			}) : /* @__PURE__ */ jsx("p", {
				className: "mt-8 text-[13.5px] text-ink-muted",
				children: "No timeline data yet — sync your profile to build history."
			})
		]
	});
}
//#endregion
export { TimelinePage as component };
