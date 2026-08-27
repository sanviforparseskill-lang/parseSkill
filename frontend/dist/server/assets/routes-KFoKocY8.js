import { t as Receipt } from "./Receipt-BTRFHCaG.js";
import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { t as SyncLog } from "./SyncLog-CpwXIEL4.js";
import { t as Wordmark } from "./Wordmark-Cp1gduGQ.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Github } from "lucide-react";
//#region src/routes/index.tsx?tsr-split=component
function Landing() {
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background text-ink",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "h-14 border-b border-line px-6 flex items-center justify-between bg-surface",
				children: [/* @__PURE__ */ jsx(Wordmark, {
					blink: true,
					className: "text-[15px]"
				}), /* @__PURE__ */ jsxs("nav", {
					className: "flex items-center gap-4 font-mono text-[12px] text-ink-muted",
					children: [
						/* @__PURE__ */ jsx(Link, {
							to: "/about",
							className: "hover:text-ink",
							children: "about"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#how",
							className: "hover:text-ink",
							children: "how it works"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#scoring",
							className: "hover:text-ink",
							children: "scoring"
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/auth/signin",
							className: "text-signal hover:opacity-90",
							children: "sign in →"
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4",
						children: "developer intelligence, evidence-based"
					}),
					/* @__PURE__ */ jsxs("h1", {
						className: "font-display font-bold leading-[1.02] text-[52px] lg:text-[56px] tracking-tight",
						children: [
							"Prove your skills",
							/* @__PURE__ */ jsx("br", {}),
							"with code.",
							/* @__PURE__ */ jsx("br", {}),
							/* @__PURE__ */ jsx("span", {
								className: "text-ink-muted",
								children: "Not checkboxes."
							})
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-6 text-[15px] leading-7 text-ink-muted max-w-lg",
						children: "Every skill, score, and role recommendation on parseSkill(); traces back to a real commit, file, or contest submission. Nothing is self-reported. You get a portfolio your commits earned."
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-8 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsxs(Link, {
							to: "/auth/signin",
							className: "inline-flex items-center gap-2 h-11 px-4 rounded-md bg-signal text-signal-foreground text-[14px] font-medium hover:opacity-90",
							children: [/* @__PURE__ */ jsx(Github, { className: "h-4 w-4" }), " Continue with GitHub"]
						}), /* @__PURE__ */ jsxs("a", {
							href: "#how",
							className: "inline-flex items-center gap-2 h-11 px-4 rounded-md border border-line text-[14px] hover:border-signal",
							children: ["See how it works ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })]
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-4 font-mono text-[11.5px] text-ink-muted",
						children: "read-access to public repos only · no writes · no background scraping"
					})
				] }), /* @__PURE__ */ jsxs("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "rounded-md border border-line overflow-hidden bg-surface",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "h-8 border-b border-line px-3 flex items-center gap-2 font-mono text-[11px] text-ink-muted",
								children: [
									/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-gap" }),
									/* @__PURE__ */ jsx("span", {
										className: "w-2 h-2 rounded-full bg-cat-frontend",
										style: { background: "#F2B84E" }
									}),
									/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-proof" }),
									/* @__PURE__ */ jsx("span", {
										className: "ml-2",
										children: "parseSkill://scan"
									})
								]
							}), /* @__PURE__ */ jsx(SyncLog, {
								className: "rounded-none border-0 h-64",
								lines: [
									{
										text: "$ parseSkill scan --user=you",
										tone: "info"
									},
									{ text: "→ reading 12 public repositories…" },
									{ text: "→ parsing 4,271 commits across Python, TypeScript, Go" },
									{ text: "→ inferring skills from AST + commit ownership" },
									{
										text: "detected: FastAPI          confidence 0.91",
										tone: "ok"
									},
									{
										text: "detected: PostgreSQL       confidence 0.88",
										tone: "ok"
									},
									{
										text: "detected: Docker           confidence 0.86",
										tone: "ok"
									},
									{
										text: "detected: Kubernetes       confidence 0.78",
										tone: "ok"
									},
									{ text: "→ generating receipts…" },
									{
										text: "✓ 3 evidenced skills verified",
										tone: "ok"
									}
								]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-4 grid gap-2",
							children: [
								{
									name: "FastAPI",
									pct: .91
								},
								{
									name: "PostgreSQL",
									pct: .88
								},
								{
									name: "Kubernetes",
									pct: .78
								}
							].map((s) => /* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-[120px_1fr] items-center gap-3 font-mono text-[12px]",
								children: [/* @__PURE__ */ jsx("span", { children: s.name }), /* @__PURE__ */ jsx(ConfidenceBar, {
									value: s.pct,
									size: "md"
								})]
							}, s.name))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "absolute -right-4 -bottom-4 hidden lg:block w-72",
							children: /* @__PURE__ */ jsx(Receipt, {
								title: "FastAPI · confidence 0.91",
								animate: false,
								items: [
									{
										label: "orbit-api",
										value: "812 commits"
									},
									{
										label: "ledger-svc",
										value: "204 commits"
									},
									{
										label: "test coverage",
										value: "83% avg"
									},
									{
										label: "arch patterns",
										value: "layered, DI"
									}
								]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				id: "how",
				className: "border-y border-line bg-surface",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-6xl mx-auto px-6 py-16",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "how it works"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-6 grid md:grid-cols-4 gap-6",
						children: [
							[
								"01",
								"Connect",
								"GitHub, plus optional LeetCode, Codeforces, Kaggle."
							],
							[
								"02",
								"Analyze",
								"Static analysis + commit weighting on every non-fork repo."
							],
							[
								"03",
								"Discover",
								"Skills, scores, and role fits — each with an evidence receipt."
							],
							[
								"04",
								"Share",
								"Publish a verified portfolio at parseskill.dev/@you."
							]
						].map(([n, t, d]) => /* @__PURE__ */ jsxs("div", {
							className: "border-t border-line pt-4",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "font-mono text-[11px] text-ink-muted",
									children: n
								}),
								/* @__PURE__ */ jsx("h3", {
									className: "mt-1 text-[16px] font-semibold",
									children: t
								}),
								/* @__PURE__ */ jsx("p", {
									className: "mt-2 text-[13.5px] text-ink-muted leading-6",
									children: d
								})
							]
						}, n))
					})]
				})
			}),
			/* @__PURE__ */ jsxs("section", {
				id: "scoring",
				className: "max-w-6xl mx-auto px-6 py-20",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "how we score you"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-4 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center",
					children: [/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("h3", {
							className: "text-[26px] font-semibold leading-tight",
							children: "Every confidence score is a formula. No black box."
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-3 text-ink-muted text-[15px] leading-7",
							children: "A skill's confidence is the weighted sum of commits, code ownership, repo complexity, and recency. We publish the equation, its weights, and the evidence receipt behind every number."
						}),
						/* @__PURE__ */ jsxs(Link, {
							to: "/about",
							className: "mt-4 inline-flex items-center gap-1 text-signal font-mono text-[12.5px] hover:underline",
							children: ["full methodology ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })]
						})
					] }), /* @__PURE__ */ jsx("pre", {
						className: "bg-surface border border-line rounded-md p-6 font-mono text-[12.5px] leading-6 overflow-x-auto",
						children: `confidence(skill) =
  0.35 · normalized(commits_touching_skill)
+ 0.25 · avg(contribution_weight_in_repos)
+ 0.20 · avg(project_complexity)
+ 0.15 · recency_decay(last_commit)
+ 0.05 · presence_in_ci_or_tests`
					})]
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				className: "border-y border-line bg-surface",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-6xl mx-auto px-6 py-16",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "what you get"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6",
						children: [
							["Skill Graph", "Every technology and skill as a node, sized by evidence, linked by project."],
							["Project Analysis", "Complexity, patterns, and ownership computed per repo."],
							["Evolution Timeline", "See when each skill entered your work and how it grew."],
							["Role Recommendations", "~25 roles matched to your evidence, with strengths and gaps listed."],
							["Personalized Roadmap", "A prerequisite-aware learning path to close the gap to a target role."],
							["Grounded AI Assistant", "Every answer cites the receipts it drew from — no hallucinated resume."],
							["Public Verified Portfolio", "A shareable, evidence-linked page at parseskill.dev/@you."]
						].map(([t, d]) => /* @__PURE__ */ jsxs("div", {
							className: "border-t border-line pt-4",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-[15px] font-semibold",
								children: t
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[13.5px] text-ink-muted leading-6",
								children: d
							})]
						}, t))
					})]
				})
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "max-w-6xl mx-auto px-6 py-20",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: "a sample portfolio"
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-4 border border-line rounded-md bg-surface overflow-hidden",
					children: [/* @__PURE__ */ jsx("div", {
						className: "h-8 border-b border-line px-3 flex items-center font-mono text-[11px] text-ink-muted",
						children: "parseskill.dev/@mayaokafor"
					}), /* @__PURE__ */ jsxs("div", {
						className: "p-6 grid md:grid-cols-[1fr_1.4fr] gap-8",
						children: [/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("div", {
								className: "text-[20px] font-semibold",
								children: "Maya Okafor"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[12px] text-ink-muted",
								children: "Backend + platform engineer, learning ML in production."
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-3 inline-flex items-center gap-1 rounded border border-proof px-1.5 py-0.5 text-proof font-mono text-[10px] tracking-widest",
								children: "VERIFIED · 20 skills · 8 repos"
							})
						] }), /* @__PURE__ */ jsx("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								["FastAPI", .91],
								["PostgreSQL", .88],
								["Docker", .86],
								["Kubernetes", .78],
								["Terraform", .74],
								["XGBoost", .68]
							].map(([n, p]) => /* @__PURE__ */ jsxs("div", {
								className: "grid grid-cols-[90px_1fr] items-center gap-2 font-mono text-[11.5px]",
								children: [/* @__PURE__ */ jsx("span", { children: n }), /* @__PURE__ */ jsx(ConfidenceBar, {
									value: p,
									size: "sm"
								})]
							}, n))
						})]
					})]
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				className: "border-y border-line bg-surface",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-4xl mx-auto px-6 py-16",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "frequently asked"
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-6 divide-y divide-line border-y border-line",
						children: [
							["What do you actually read from my GitHub?", "Public repository contents, commit history authored by you, and file paths. We never request write access, private repos, or your email."],
							["Is my data sold or shared?", "No. Aggregate role-fit models are trained on public datasets (Tabiya ESCO, Kaggle LinkedIn Jobs, Stack Overflow Survey). Your data stays yours."],
							["How often does it re-sync?", "Manually, from your dashboard. There is no background scraper. You are always in control of when new evidence enters your profile."],
							["Can I hide a project?", "Yes. Each project has a visibility toggle. Confidence scores still recompute honestly from what remains."]
						].map(([q, a]) => /* @__PURE__ */ jsxs("details", {
							className: "group py-4",
							children: [/* @__PURE__ */ jsxs("summary", {
								className: "cursor-pointer list-none flex items-center justify-between",
								children: [/* @__PURE__ */ jsx("span", {
									className: "font-medium text-[15px]",
									children: q
								}), /* @__PURE__ */ jsx("span", {
									className: "font-mono text-ink-muted group-open:rotate-45 transition-transform",
									children: "+"
								})]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-2 text-[14px] text-ink-muted leading-7",
								children: a
							})]
						}, q))
					})]
				})
			}),
			/* @__PURE__ */ jsxs("footer", {
				className: "max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[12px] text-ink-muted",
				children: [/* @__PURE__ */ jsx(Wordmark, { className: "text-[13px]" }), /* @__PURE__ */ jsxs("nav", {
					className: "flex gap-4",
					children: [
						/* @__PURE__ */ jsx(Link, {
							to: "/about",
							className: "hover:text-ink",
							children: "about"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#",
							className: "hover:text-ink",
							children: "docs"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#",
							className: "hover:text-ink",
							children: "github"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#",
							className: "hover:text-ink",
							children: "contact"
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { Landing as component };
