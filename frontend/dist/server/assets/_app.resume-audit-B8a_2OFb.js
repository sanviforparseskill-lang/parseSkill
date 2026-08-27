import { t as Receipt } from "./Receipt-BTRFHCaG.js";
import { D as useUploadResume, p as useResumeAudit } from "./queries-DP0lSQXe.js";
import { t as ConfidenceBar } from "./ConfidenceBar-d8-_clrU.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { Briefcase, CircleAlert, FileCheck2, GraduationCap, Upload } from "lucide-react";
//#region src/routes/_app.resume-audit.tsx?tsr-split=component
function ResumeAuditPage() {
	const { data: audit, isLoading } = useResumeAudit();
	const uploadResume = useUploadResume();
	const onFileChosen = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		uploadResume.mutate(file, {
			onSuccess: (result) => toast.success(`Resume parsed — ${result.skills_claimed.length} skills claimed`),
			onError: () => toast.error("Could not parse resume")
		});
		e.target.value = "";
	};
	const hasResume = !!audit && audit.skills.length > 0;
	const implemented = audit?.skills.filter((s) => s.implemented) ?? [];
	const unimplemented = audit?.skills.filter((s) => !s.implemented) ?? [];
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-7xl mx-auto px-6 py-8 pb-24",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-baseline justify-between flex-wrap gap-3",
				children: [/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
						children: "resume audit"
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "text-[28px] font-semibold mt-0.5",
						children: "Does your resume match your receipts?"
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-[14px] text-ink-muted mt-1",
						children: "Every skill you claim, checked against the code evidence already collected from your repos — education and work history included for reference."
					})
				] }), /* @__PURE__ */ jsxs("label", {
					className: "h-9 px-3 rounded border border-line font-mono text-[12px] hover:border-signal inline-flex items-center gap-2 cursor-pointer shrink-0",
					children: [
						/* @__PURE__ */ jsx(Upload, { className: "h-3.5 w-3.5" }),
						uploadResume.isPending ? "parsing…" : hasResume ? "re-upload resume" : "upload resume",
						/* @__PURE__ */ jsx("input", {
							type: "file",
							accept: "application/pdf",
							onChange: onFileChosen,
							disabled: uploadResume.isPending,
							className: "hidden"
						})
					]
				})]
			}),
			!isLoading && !hasResume && /* @__PURE__ */ jsxs("div", {
				className: "mt-10 border border-dashed border-line rounded-md p-10 text-center",
				children: [/* @__PURE__ */ jsx(FileCheck2, { className: "h-6 w-6 mx-auto text-ink-muted" }), /* @__PURE__ */ jsx("p", {
					className: "mt-3 text-[13.5px] text-ink-muted",
					children: "No resume on file yet. Upload a PDF and we'll check every skill you claim against what your synced repos actually prove."
				})]
			}),
			hasResume && audit && /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsx("div", {
					className: "mt-6 border border-line rounded-md bg-surface p-5",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between flex-wrap gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
								children: "credibility score"
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "text-[32px] font-semibold mt-0.5 tabular-nums",
								children: [Math.round((audit.credibility_score ?? 0) * 100), "%"]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-[12.5px] text-ink-muted mt-1",
								children: [
									implemented.length,
									" of ",
									audit.skills.length,
									" claimed skills are backed by code you actually wrote."
								]
							})
						] }), /* @__PURE__ */ jsx("div", {
							className: "w-full sm:w-64",
							children: /* @__PURE__ */ jsx(ConfidenceBar, {
								value: audit.credibility_score ?? 0,
								size: "md"
							})
						})]
					})
				}),
				implemented.length > 0 && /* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "proven in code"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-[18px] font-semibold mt-0.5",
							children: "Backed by your repos"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-4",
							children: implemented.map((s) => /* @__PURE__ */ jsx(Receipt, {
								title: s.name,
								stamp: "VERIFIED",
								items: [{
									label: "confidence",
									value: `${Math.round((s.confidence ?? 0) * 100)}%`
								}, ...s.evidence_repos.slice(0, 4).map((e) => ({
									label: "repo",
									value: e.repo_full_name
								}))]
							}, s.name))
						})
					]
				}),
				unimplemented.length > 0 && /* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
							children: "no proof seen"
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-[18px] font-semibold mt-0.5",
							children: "Claimed, but not in your synced code"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-[13px] text-ink-muted mt-1",
							children: "Not necessarily wrong — could be a skill from a private repo, a non-GitHub project, or just not reflected in what's synced yet."
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: unimplemented.map((s) => /* @__PURE__ */ jsxs("span", {
								className: "inline-flex items-center gap-1.5 font-mono text-[12px] px-2.5 py-1.5 rounded border border-line text-ink-muted",
								children: [/* @__PURE__ */ jsx(CircleAlert, { className: "h-3.5 w-3.5" }), s.name]
							}, s.name))
						})
					]
				}),
				audit.education.length > 0 && /* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5",
						children: [/* @__PURE__ */ jsx(GraduationCap, { className: "h-3.5 w-3.5" }), " education"]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-3 border border-line rounded-md bg-surface divide-y divide-line",
						children: audit.education.map((e, i) => /* @__PURE__ */ jsxs("div", {
							className: "p-4 font-mono text-[12.5px]",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "text-ink",
								children: [
									e.degree ?? "—",
									" ",
									e.field ? `in ${e.field}` : ""
								]
							}), /* @__PURE__ */ jsxs("div", {
								className: "text-ink-muted mt-0.5",
								children: [
									e.institution ?? "—",
									" ",
									e.year ? `· ${e.year}` : ""
								]
							})]
						}, i))
					})]
				}),
				audit.work_experience.length > 0 && /* @__PURE__ */ jsxs("section", {
					className: "mt-10",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5",
						children: [/* @__PURE__ */ jsx(Briefcase, { className: "h-3.5 w-3.5" }), " work experience"]
					}), /* @__PURE__ */ jsx("div", {
						className: "mt-3 border border-line rounded-md bg-surface divide-y divide-line",
						children: audit.work_experience.map((w, i) => /* @__PURE__ */ jsxs("div", {
							className: "p-4 font-mono text-[12.5px]",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "text-ink",
								children: [
									w.title ?? "—",
									" · ",
									w.company ?? "—"
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "text-ink-muted mt-0.5",
								children: w.start_date ? `${w.start_date} – ${w.end_date ?? "present"}` : ""
							})]
						}, i))
					})]
				})
			] })
		]
	});
}
//#endregion
export { ResumeAuditPage as component };
