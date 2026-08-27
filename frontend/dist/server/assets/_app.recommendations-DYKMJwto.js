import { t as Receipt } from "./Receipt-BTRFHCaG.js";
import { b as useSkillGap, g as useRolePredictions, l as useProjectIdeas } from "./queries-DP0lSQXe.js";
import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { t as RoleFitCard } from "./RoleFitCard-C7_LVfyh.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/_app.recommendations.tsx?tsr-split=component
function Rec() {
	const { data: roles } = useRolePredictions();
	const list = roles ?? [];
	const top = list.slice(0, 3);
	const rest = list.slice(3);
	const { data: gap } = useSkillGap(top[0]?.role_id ?? null);
	const { data: projectIdeas } = useProjectIdeas();
	const gapSkills = (gap ?? []).filter((g) => !g.already_have);
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "recommendations"
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "text-[28px] font-semibold mt-0.5",
					children: "Roles matched to your evidence"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[14px] text-ink-muted mt-1",
					children: "Each fit is computed from your inferred skills against role requirements."
				})
			] }),
			top.length > 0 ? /* @__PURE__ */ jsx("div", {
				className: "mt-6 grid md:grid-cols-3 gap-4",
				children: top.map((r) => /* @__PURE__ */ jsx(RoleFitCard, {
					role: r,
					size: "lg"
				}, r.role_id))
			}) : /* @__PURE__ */ jsx("p", {
				className: "mt-6 text-[13.5px] text-ink-muted",
				children: "No role predictions yet — sync your profile first."
			}),
			top[0] && /* @__PURE__ */ jsxs("section", {
				className: "mt-12",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "skill gap deep dive"
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-[20px] font-semibold mt-0.5",
						children: top[0].role_name
					}),
					gapSkills.length > 0 ? /* @__PURE__ */ jsx("div", {
						className: "mt-4 grid md:grid-cols-2 gap-4",
						children: gapSkills.slice(0, 6).map((g, i) => /* @__PURE__ */ jsx(Receipt, {
							title: `gap · ${g.skill_name}`,
							items: [
								{
									label: "priority",
									value: i === 0 ? "P0" : i === 1 ? "P1" : "P2"
								},
								{
									label: "priority score",
									value: g.priority_score.toFixed(2)
								},
								{
									label: "role importance",
									value: g.importance.toFixed(2)
								}
							]
						}, g.skill_id))
					}) : /* @__PURE__ */ jsx("p", {
						className: "mt-3 text-[13px] text-ink-muted",
						children: "No skill-gap data available for this role yet."
					})
				]
			}),
			projectIdeas && projectIdeas.length > 0 && /* @__PURE__ */ jsxs("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "suggested projects"
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-3 grid md:grid-cols-2 gap-4",
					children: projectIdeas.slice(0, 4).map((idea) => /* @__PURE__ */ jsxs("div", {
						className: "border border-line rounded-md p-4 bg-surface",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[13px] font-semibold",
								children: idea.title
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-[13px] text-ink-muted mt-1 leading-6",
								children: idea.description
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-2 flex flex-wrap gap-1",
								children: idea.skills_exercised.map((s) => /* @__PURE__ */ jsx("span", {
									className: "font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-secondary/60",
									children: s
								}, s))
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "mt-2 font-mono text-[11px] text-ink-muted",
								children: [
									idea.estimated_hours,
									"h · complexity ",
									idea.complexity
								]
							})
						]
					}, idea.title))
				})]
			}),
			rest.length > 0 && /* @__PURE__ */ jsxs("section", {
				className: "mt-12",
				children: [/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "all roles"
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-3 border border-line rounded-md bg-surface divide-y divide-line",
					children: rest.map((r) => /* @__PURE__ */ jsxs("div", {
						className: "p-4 grid grid-cols-[1.5fr_2fr_1fr] items-center gap-4",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "text-[14px] font-semibold",
								children: r.role_name
							}),
							/* @__PURE__ */ jsx(ConfidenceBar, {
								value: r.confidence,
								size: "md"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "font-mono text-[12px] text-ink-muted text-right",
								children: [Math.round(r.confidence * 100), "% fit"]
							})
						]
					}, r.role_id))
				})]
			})
		]
	});
}
//#endregion
export { Rec as component };
