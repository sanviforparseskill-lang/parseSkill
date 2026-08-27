import { t as Wordmark } from "./Wordmark-Cp1gduGQ.js";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/about.tsx?tsr-split=component
function Section({ title, children }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "border-t border-line pt-6 mt-8",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
			children: title
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-3",
			children
		})]
	});
}
function AccuracyBar({ label, precision, recall }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "grid grid-cols-[180px_1fr] items-center gap-4 py-2 font-mono text-[12px]",
		children: [/* @__PURE__ */ jsx("span", { children: label }), /* @__PURE__ */ jsxs("div", {
			className: "space-y-1",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "w-16 text-ink-muted",
						children: "precision"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex-1 h-1 bg-secondary rounded-full overflow-hidden",
						children: /* @__PURE__ */ jsx("div", {
							className: "h-full bg-proof",
							style: { width: `${precision * 100}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "w-10 text-right tabular-nums",
						children: [(precision * 100).toFixed(0), "%"]
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "w-16 text-ink-muted",
						children: "recall"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "flex-1 h-1 bg-secondary rounded-full overflow-hidden",
						children: /* @__PURE__ */ jsx("div", {
							className: "h-full bg-signal",
							style: { width: `${recall * 100}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "w-10 text-right tabular-nums",
						children: [(recall * 100).toFixed(0), "%"]
					})
				]
			})]
		})]
	});
}
function About() {
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ jsxs("header", {
			className: "h-14 border-b border-line px-6 flex items-center justify-between bg-surface",
			children: [/* @__PURE__ */ jsx(Link, {
				to: "/",
				children: /* @__PURE__ */ jsx(Wordmark, { className: "text-[15px]" })
			}), /* @__PURE__ */ jsx(Link, {
				to: "/",
				className: "font-mono text-[12px] text-ink-muted hover:text-ink",
				children: "← home"
			})]
		}), /* @__PURE__ */ jsxs("div", {
			className: "max-w-3xl mx-auto px-6 py-16",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display font-bold text-4xl tracking-tight",
					children: "How we score you"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-4 text-ink-muted leading-7 text-[15px]",
					children: "parseSkill(); is built on one claim: every number we show you can be traced back to your code. This page publishes the formulas, the datasets, and the measured accuracy behind every claim."
				}),
				/* @__PURE__ */ jsx(Section, {
					title: "skill confidence",
					children: /* @__PURE__ */ jsx("pre", {
						className: "bg-surface border border-line rounded-md p-4 font-mono text-[12.5px] leading-6 overflow-x-auto",
						children: `confidence(skill) =
  0.35 · normalized(commits_touching_skill)
+ 0.25 · avg(contribution_weight_in_repos)
+ 0.20 · avg(project_complexity)
+ 0.15 · recency_decay(last_commit)
+ 0.05 · presence_in_ci_or_tests`
					})
				}),
				/* @__PURE__ */ jsx(Section, {
					title: "project complexity",
					children: /* @__PURE__ */ jsx("pre", {
						className: "bg-surface border border-line rounded-md p-4 font-mono text-[12.5px] leading-6 overflow-x-auto",
						children: `complexity(repo) =
  0.30 · log(non_generated_LoC)
+ 0.25 · architectural_pattern_count
+ 0.20 · module_coupling_inverse
+ 0.15 · test_coverage
+ 0.10 · CI/CD_maturity`
					})
				}),
				/* @__PURE__ */ jsx(Section, {
					title: "data sources",
					children: /* @__PURE__ */ jsxs("ul", {
						className: "space-y-2 text-[14px] leading-7",
						children: [
							/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("b", { children: "Tabiya ESCO occupations" }), " — role definitions and required skills. CC-BY-4.0."] }),
							/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("b", { children: "Kaggle LinkedIn Jobs (2023)" }), " — market demand signal for role-fit weighting. CC0."] }),
							/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("b", { children: "Stack Overflow Developer Survey" }), " — technology co-occurrence priors. ODbL."] }),
							/* @__PURE__ */ jsxs("li", { children: [/* @__PURE__ */ jsx("b", { children: "Your GitHub (public repos only)" }), " — the only source of you-specific evidence."] })
						]
					})
				}),
				/* @__PURE__ */ jsx(Section, {
					title: "what we do not do",
					children: /* @__PURE__ */ jsxs("ul", {
						className: "space-y-2 text-[14px] leading-7 text-ink",
						children: [
							/* @__PURE__ */ jsx("li", { children: "— No selling or brokering your data." }),
							/* @__PURE__ */ jsx("li", { children: "— No background scraping. Syncs happen only when you press the button." }),
							/* @__PURE__ */ jsx("li", { children: "— No auto-fetching of private repos or emails." }),
							/* @__PURE__ */ jsx("li", { children: "— No inferring skills you never touched. If it's on your profile, we can point to the commits." })
						]
					})
				}),
				/* @__PURE__ */ jsxs(Section, {
					title: "measured accuracy",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "border border-line rounded-md bg-surface p-4",
						children: [
							/* @__PURE__ */ jsx(AccuracyBar, {
								label: "skill inference",
								precision: .94,
								recall: .87
							}),
							/* @__PURE__ */ jsx(AccuracyBar, {
								label: "role predictor (top-3)",
								precision: .81,
								recall: .78
							}),
							/* @__PURE__ */ jsx(AccuracyBar, {
								label: "architecture pattern detection",
								precision: .76,
								recall: .69
							})
						]
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-3 font-mono text-[11.5px] text-ink-muted",
						children: "evaluated on a held-out set of 1,200 hand-labeled public repositories · reproduced quarterly"
					})]
				})
			]
		})]
	});
}
//#endregion
export { About as component };
