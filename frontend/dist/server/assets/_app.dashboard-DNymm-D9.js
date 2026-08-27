import { t as cn } from "./utils-C_uf36nf.js";
import { i as sseUrl } from "./api-CdQxeiZX.js";
import { C as useTriggerSync, g as useRolePredictions, s as useProfile, u as useProjects, x as useSkills } from "./queries-DP0lSQXe.js";
import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { t as RoleFitCard } from "./RoleFitCard-C7_LVfyh.js";
import { t as colorForCategory } from "./category-colors-ClAVImTi.js";
import { t as SyncLog } from "./SyncLog-CpwXIEL4.js";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Minus, RefreshCw } from "lucide-react";
//#region src/components/brand/ScoreCard.tsx
function ScoreCard({ label, value, trend, spark, onClick }) {
	const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
	const trendColor = trend > 0 ? "text-proof" : trend < 0 ? "text-gap" : "text-ink-muted";
	const max = spark ? Math.max(...spark) : 100;
	const min = spark ? Math.min(...spark) : 0;
	const range = Math.max(1, max - min);
	return /* @__PURE__ */ jsxs("button", {
		onClick,
		className: "group text-left bg-surface border border-line rounded-md p-4 hover:border-signal transition-colors",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-mono text-[11px] uppercase tracking-wider text-ink-muted",
					children: label
				}), /* @__PURE__ */ jsxs("span", {
					className: cn("flex items-center gap-0.5 font-mono text-[11px]", trendColor),
					children: [
						/* @__PURE__ */ jsx(TrendIcon, { className: "h-3 w-3" }),
						trend > 0 ? "+" : "",
						trend
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-2 flex items-baseline gap-1",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-display font-bold text-3xl text-ink tabular-nums",
					children: value
				}), /* @__PURE__ */ jsx("span", {
					className: "font-mono text-xs text-ink-muted",
					children: "/100"
				})]
			}),
			spark && /* @__PURE__ */ jsx("svg", {
				viewBox: "0 0 100 24",
				className: "mt-3 w-full h-6 overflow-visible",
				preserveAspectRatio: "none",
				children: /* @__PURE__ */ jsx("polyline", {
					fill: "none",
					stroke: "var(--proof)",
					strokeWidth: "1.5",
					vectorEffect: "non-scaling-stroke",
					points: spark.map((v, i) => `${i / (spark.length - 1) * 100},${24 - (v - min) / range * 22}`).join(" ")
				})
			})
		]
	});
}
//#endregion
//#region src/routes/_app.dashboard.tsx?tsr-split=component
function PageTitle({ eyebrow, title, sub }) {
	return /* @__PURE__ */ jsxs("div", { children: [
		eyebrow && /* @__PURE__ */ jsx("div", {
			className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
			children: eyebrow
		}),
		/* @__PURE__ */ jsx("h1", {
			className: "text-[28px] leading-9 font-semibold mt-0.5",
			children: title
		}),
		sub && /* @__PURE__ */ jsx("p", {
			className: "text-[14px] text-ink-muted mt-1",
			children: sub
		})
	] });
}
function Dashboard() {
	const qc = useQueryClient();
	const { data: profile } = useProfile();
	const { data: roles } = useRolePredictions();
	const { data: skills } = useSkills();
	const { data: projects } = useProjects();
	const triggerSync = useTriggerSync();
	const [state, setState] = useState("idle");
	const [lines, setLines] = useState([]);
	const eventSourceRef = useRef(null);
	const autoSyncedRef = useRef(false);
	useEffect(() => () => eventSourceRef.current?.close(), []);
	const startSync = async () => {
		setState("syncing");
		setLines([{
			text: "$ parseSkill sync",
			tone: "info"
		}]);
		try {
			const { job_id } = await triggerSync.mutateAsync();
			const es = new EventSource(sseUrl(`/sync/stream/${job_id}`), { withCredentials: true });
			eventSourceRef.current = es;
			es.addEventListener("progress", (evt) => {
				const payload = JSON.parse(evt.data);
				setLines((prev) => [...prev, {
					text: `→ ${payload.stage}`,
					tone: payload.stage === "error" ? "warn" : void 0
				}]);
				if (payload.stage === "done") {
					setState("done");
					toast.success("Sync complete");
					qc.invalidateQueries({ queryKey: ["profile"] });
					qc.invalidateQueries({ queryKey: ["skills"] });
					qc.invalidateQueries({ queryKey: ["projects"] });
					qc.invalidateQueries({ queryKey: ["recommendations"] });
					es.close();
					setTimeout(() => setState("idle"), 2500);
				} else if (payload.stage === "error") {
					toast.error("Sync failed");
					es.close();
					setState("idle");
				}
			});
			es.onerror = () => {
				es.close();
				setState((s) => s === "syncing" ? "idle" : s);
			};
		} catch {
			toast.error("Could not start sync");
			setState("idle");
		}
	};
	useEffect(() => {
		if (autoSyncedRef.current) return;
		if (!profile || profile.last_synced_at) return;
		autoSyncedRef.current = true;
		startSync();
	}, [profile]);
	const topRoles = roles?.slice(0, 3) ?? [];
	const recentProjects = projects?.slice(0, 5) ?? [];
	const topSkills = skills?.slice(0, 20) ?? [];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "border border-line bg-surface rounded-md p-6 grid md:grid-cols-[1fr_auto] gap-6 items-center",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-4 min-w-0",
					children: [profile?.avatar_url ? /* @__PURE__ */ jsx("img", {
						src: profile.avatar_url,
						className: "w-14 h-14 rounded-full border border-line bg-secondary",
						alt: ""
					}) : /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full border border-line bg-secondary" }), /* @__PURE__ */ jsxs("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
								children: "welcome back"
							}),
							/* @__PURE__ */ jsx("h1", {
								className: "text-[24px] font-semibold truncate",
								children: profile?.display_name ?? profile?.github_handle ?? "…"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-[13.5px] text-ink-muted truncate",
								children: profile?.tagline ?? "No tagline yet — add one in settings."
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "font-mono text-[11px] text-ink-muted mt-1",
								children: ["last synced · ", profile?.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : "never"]
							})
						]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-6",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "text-right",
						children: [/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "developer score"
						}), /* @__PURE__ */ jsx("div", {
							className: "font-display font-bold text-5xl leading-none mt-1 tabular-nums",
							children: profile?.coding_score != null ? Math.round(profile.coding_score) : "—"
						})]
					}), /* @__PURE__ */ jsxs("button", {
						onClick: startSync,
						disabled: state !== "idle",
						className: "h-10 px-4 rounded bg-ink text-background font-mono text-[12.5px] disabled:opacity-70 hover:bg-signal transition-colors inline-flex items-center gap-2",
						children: [
							state === "idle" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4" }), " update profile"] }),
							state === "syncing" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }), " syncing…"] }),
							state === "done" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }), " synced"] })
						]
					})]
				})]
			}),
			state === "syncing" && /* @__PURE__ */ jsx("div", {
				className: "mt-4",
				children: /* @__PURE__ */ jsx(SyncLog, {
					className: "h-48",
					lines,
					done: true
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6",
				children: [
					/* @__PURE__ */ jsx(ScoreCard, {
						label: "Coding",
						value: profile?.coding_score != null ? Math.round(profile.coding_score) : 0,
						trend: 0
					}),
					/* @__PURE__ */ jsx(ScoreCard, {
						label: "Project Quality",
						value: profile?.project_quality_score != null ? Math.round(profile.project_quality_score) : 0,
						trend: 0
					}),
					/* @__PURE__ */ jsx(ScoreCard, {
						label: "Consistency",
						value: profile?.consistency_score != null ? Math.round(profile.consistency_score) : 0,
						trend: 0
					}),
					/* @__PURE__ */ jsx(ScoreCard, {
						label: "Learning Velocity",
						value: profile?.learning_velocity != null ? Math.round(profile.learning_velocity) : 0,
						trend: 0
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ jsx(PageTitle, {
						eyebrow: "career fit",
						title: "Top predicted roles"
					}), /* @__PURE__ */ jsx(Link, {
						to: "/recommendations",
						className: "font-mono text-[12px] text-signal hover:underline",
						children: "see full recommendations →"
					})]
				}), topRoles.length > 0 ? /* @__PURE__ */ jsx("div", {
					className: "mt-4 grid md:grid-cols-3 gap-4",
					children: topRoles.map((r) => /* @__PURE__ */ jsx(RoleFitCard, { role: r }, r.role_id))
				}) : /* @__PURE__ */ jsx("p", {
					className: "mt-4 text-[13.5px] text-ink-muted",
					children: "No role predictions yet — sync your profile to generate them."
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-10 grid lg:grid-cols-[1.3fr_1fr] gap-6",
				children: [/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx(PageTitle, {
					eyebrow: "recent activity",
					title: "What's changed since last sync"
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-4 border border-line rounded-md bg-surface divide-y divide-line",
					children: recentProjects.length > 0 ? recentProjects.map((p) => /* @__PURE__ */ jsxs("div", {
						className: "p-4 flex items-center justify-between gap-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[13px]",
								children: p.repo_full_name
							}), /* @__PURE__ */ jsx("div", {
								className: "text-[12.5px] text-ink-muted truncate",
								children: p.description
							})]
						}), /* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] text-ink-muted whitespace-nowrap",
							children: p.last_commit_at ? new Date(p.last_commit_at).toLocaleDateString() : ""
						})]
					}, p.id)) : /* @__PURE__ */ jsx("div", {
						className: "p-4 text-[13px] text-ink-muted",
						children: "No projects analyzed yet."
					})
				})] }), /* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-baseline justify-between",
					children: [/* @__PURE__ */ jsx(PageTitle, {
						eyebrow: "skill graph",
						title: "Top skills"
					}), /* @__PURE__ */ jsx(Link, {
						to: "/graph",
						className: "font-mono text-[12px] text-signal hover:underline",
						children: "explore full graph →"
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-4 border border-line rounded-md bg-surface p-4",
					children: [/* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 300 260",
						className: "w-full h-64",
						children: [topSkills.map((s, i) => {
							const angle = i / Math.max(topSkills.length, 1) * Math.PI * 2;
							const r = 40 + s.confidence * 70;
							const cx = 150 + Math.cos(angle) * r;
							const cy = 130 + Math.sin(angle) * r;
							const size = 4 + s.confidence * 6;
							return /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
								x1: 150,
								y1: 130,
								x2: cx,
								y2: cy,
								stroke: "var(--line)",
								strokeWidth: "0.6"
							}), /* @__PURE__ */ jsx("circle", {
								cx,
								cy,
								r: size,
								fill: colorForCategory(s.category),
								opacity: .85
							})] }, s.id);
						}), /* @__PURE__ */ jsx("circle", {
							cx: 150,
							cy: 130,
							r: 7,
							fill: "var(--ink)"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]",
						children: [topSkills.slice(0, 8).map((s) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "truncate flex items-center gap-1.5",
								children: [/* @__PURE__ */ jsx("span", {
									className: "w-2 h-2 rounded-sm",
									style: { background: colorForCategory(s.category) }
								}), s.name]
							}), /* @__PURE__ */ jsx("span", {
								className: "w-20 shrink-0",
								children: /* @__PURE__ */ jsx(ConfidenceBar, {
									value: s.confidence,
									showLabel: false
								})
							})]
						}, s.id)), topSkills.length === 0 && /* @__PURE__ */ jsx("div", {
							className: "text-ink-muted col-span-2",
							children: "No skills detected yet."
						})]
					})]
				})] })]
			})
		]
	});
}
//#endregion
export { Dashboard as component };
