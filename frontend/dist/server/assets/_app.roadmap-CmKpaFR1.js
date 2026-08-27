import { g as useRolePredictions, h as useRoadmap, v as useSetRoadmapStatus } from "./queries-DP0lSQXe.js";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/_app.roadmap.tsx?tsr-split=component
var STATUS_LABEL = {
	not_started: "Todo",
	learning: "Learning",
	done: "Done"
};
function RoadmapPage() {
	const { data: roles } = useRolePredictions();
	const [roleId, setRoleId] = useState(null);
	useEffect(() => {
		if (!roleId && roles && roles.length > 0) setRoleId(roles[0].role_id);
	}, [roles, roleId]);
	const { data: items } = useRoadmap(roleId);
	const setStatus = useSetRoadmapStatus();
	const role = roles?.find((r) => r.role_id === roleId);
	const list = items ?? [];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-baseline justify-between flex-wrap gap-4",
			children: [/* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "roadmap"
				}),
				/* @__PURE__ */ jsxs("h1", {
					className: "text-[28px] font-semibold mt-0.5",
					children: ["Learning path to ", role?.role_name ?? "…"]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-[14px] text-ink-muted mt-1",
					children: "Prerequisite-aware skill ordering for your target role."
				})
			] }), /* @__PURE__ */ jsx("select", {
				value: roleId ?? "",
				onChange: (e) => setRoleId(e.target.value),
				className: "h-9 border border-line rounded bg-surface px-2 font-mono text-[12px]",
				children: (roles ?? []).map((r) => /* @__PURE__ */ jsx("option", {
					value: r.role_id,
					children: r.role_name
				}, r.role_id))
			})]
		}), list.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "mt-8 text-[13.5px] text-ink-muted",
			children: "No roadmap steps available for this role yet — required-skill data for this role hasn't been curated."
		}) : /* @__PURE__ */ jsx("div", {
			className: "mt-8 grid md:grid-cols-2 gap-4",
			children: list.map((it) => /* @__PURE__ */ jsxs("div", {
				className: "border border-line bg-surface rounded-md p-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-baseline justify-between",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[13px] font-semibold",
							children: it.skill_name
						}), /* @__PURE__ */ jsx("span", {
							className: `font-mono text-[10.5px] px-2 py-0.5 rounded border ${it.status === "learning" ? "border-signal text-signal" : it.status === "done" ? "border-proof text-proof" : "border-line text-ink-muted"}`,
							children: STATUS_LABEL[it.status] ?? it.status
						})]
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "text-[13px] text-ink-muted mt-1",
						children: [
							"Estimated ",
							it.estimated_hours,
							"h"
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "mt-3 flex gap-1.5",
						children: [
							"not_started",
							"learning",
							"done"
						].map((s) => /* @__PURE__ */ jsx("button", {
							disabled: !roleId,
							onClick: () => roleId && setStatus.mutate({
								skillId: it.skill_id,
								roleId,
								status: s
							}),
							className: `font-mono text-[10.5px] px-2 py-1 border rounded ${it.status === s ? "border-signal text-signal" : "border-line text-ink-muted hover:border-signal"}`,
							children: STATUS_LABEL[s]
						}, s))
					})
				]
			}, it.skill_id))
		})]
	});
}
//#endregion
export { RoadmapPage as component };
