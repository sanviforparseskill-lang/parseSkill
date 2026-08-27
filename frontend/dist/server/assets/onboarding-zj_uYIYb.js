import { i as sseUrl } from "./api-CdQxeiZX.js";
import { C as useTriggerSync, D as useUploadResume, E as useUpdateProfile, O as useVerificationToken, a as useLinkAccount, r as useCurrentUser, s as useProfile } from "./queries-DP0lSQXe.js";
import { t as SyncLog } from "./SyncLog-CpwXIEL4.js";
import { t as Wordmark } from "./Wordmark-Cp1gduGQ.js";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/onboarding.tsx?tsr-split=component
var steps = [
	"Confirm identity",
	"Link platforms",
	"Optional resume"
];
function Onboarding() {
	const nav = useNavigate();
	const { data: user } = useCurrentUser();
	const { data: profile } = useProfile();
	const updateProfile = useUpdateProfile();
	const linkAccount = useLinkAccount();
	const uploadResume = useUploadResume();
	const triggerSync = useTriggerSync();
	const { data: verification } = useVerificationToken();
	const [step, setStep] = useState(0);
	const [syncing, setSyncing] = useState(false);
	const [lines, setLines] = useState([]);
	const [tagline, setTagline] = useState("");
	const [name, setName] = useState("");
	const [handles, setHandles] = useState({
		leetcode: "",
		codeforces: "",
		kaggle: ""
	});
	const eventSourceRef = useRef(null);
	useEffect(() => {
		if (profile) {
			setName(profile.display_name ?? "");
			setTagline(profile.tagline ?? "");
		}
	}, [profile]);
	useEffect(() => () => eventSourceRef.current?.close(), []);
	const startInitialSync = async () => {
		if (name || tagline) await updateProfile.mutateAsync({
			display_name: name || void 0,
			tagline: tagline || void 0
		});
		setSyncing(true);
		setLines([{
			text: "$ parseSkill sync --initial",
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
					toast.success("Sync complete");
					es.close();
					nav({ to: "/dashboard" });
				} else if (payload.stage === "error") {
					toast.error("Sync failed — you can retry from the dashboard");
					es.close();
					nav({ to: "/dashboard" });
				}
			});
			es.onerror = () => {
				es.close();
				nav({ to: "/dashboard" });
			};
		} catch {
			toast.error("Could not start sync");
			nav({ to: "/dashboard" });
		}
	};
	const next = () => {
		if (step < 2) setStep(step + 1);
		else startInitialSync();
	};
	const skip = () => step < 2 ? setStep(step + 1) : startInitialSync();
	const verify = (platform) => {
		const handle = handles[platform];
		if (!handle) return;
		linkAccount.mutate({
			platform,
			handle
		}, {
			onSuccess: () => toast.success(`${platform} linked`),
			onError: (err) => toast.error(err instanceof Error ? err.message : `Could not link ${platform}`)
		});
	};
	const onResumeChosen = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		uploadResume.mutate(file, {
			onSuccess: (result) => toast.success(`Resume parsed — ${result.skills_claimed.length} skills claimed`),
			onError: () => toast.error("Could not parse resume")
		});
	};
	if (syncing) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen bg-background grid place-items-center px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-2xl",
			children: [/* @__PURE__ */ jsx("div", {
				className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3",
				children: "initial sync · this only happens once"
			}), /* @__PURE__ */ jsx(SyncLog, {
				className: "h-80",
				lines,
				done: true
			})]
		})
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ jsx("header", {
			className: "h-14 border-b border-line px-6 flex items-center bg-surface",
			children: /* @__PURE__ */ jsx(Wordmark, { className: "text-[15px]" })
		}), /* @__PURE__ */ jsxs("div", {
			className: "max-w-2xl mx-auto px-4 py-14",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
					children: [
						"Step ",
						step + 1,
						" of ",
						steps.length,
						" — ",
						steps[step]
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-2 flex gap-1",
					children: steps.map((_, i) => /* @__PURE__ */ jsx("div", { className: `h-1 flex-1 rounded ${i <= step ? "bg-signal" : "bg-secondary"}` }, i))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-8 border border-line bg-surface rounded-md p-6",
					children: [
						step === 0 && /* @__PURE__ */ jsxs("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ jsx("h2", {
									className: "text-xl font-semibold",
									children: "Confirm identity"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink-muted",
									children: "Pulled from GitHub. Edit anything before continuing."
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-3",
									children: [user?.avatar_url ? /* @__PURE__ */ jsx("img", {
										src: user.avatar_url,
										className: "w-14 h-14 rounded-full border border-line bg-secondary",
										alt: ""
									}) : /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full border border-line bg-secondary" }), /* @__PURE__ */ jsx("div", {
										className: "text-xs font-mono text-ink-muted",
										children: "avatar from GitHub"
									})]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "block",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-mono text-[11px] uppercase text-ink-muted",
										children: "display name"
									}), /* @__PURE__ */ jsx("input", {
										value: name,
										onChange: (e) => setName(e.target.value),
										className: "mt-1 w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] focus:border-signal outline-none"
									})]
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "block",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-mono text-[11px] uppercase text-ink-muted",
										children: "tagline"
									}), /* @__PURE__ */ jsx("input", {
										value: tagline,
										onChange: (e) => setTagline(e.target.value),
										className: "mt-1 w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] focus:border-signal outline-none"
									})]
								})
							]
						}),
						step === 1 && /* @__PURE__ */ jsxs("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ jsx("h2", {
									className: "text-xl font-semibold",
									children: "Link additional platforms"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink-muted",
									children: "Each one adds evidence nodes to your skill graph. All optional."
								}),
								verification && /* @__PURE__ */ jsxs("div", {
									className: "p-3 rounded border border-line bg-background font-mono text-[11.5px] text-ink-muted space-y-1.5",
									children: [
										/* @__PURE__ */ jsx("p", { children: "LeetCode and Codeforces require proving you own the handle: paste this token into your profile bio first, then click verify." }),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ jsx("code", {
												className: "px-2 py-1 rounded bg-secondary text-ink",
												children: verification.token
											}), /* @__PURE__ */ jsx("button", {
												onClick: () => {
													navigator.clipboard.writeText(verification.token);
													toast.success("Token copied");
												},
												className: "px-2 h-6 border border-line rounded text-[10.5px] hover:border-signal",
												children: "copy"
											})]
										}),
										/* @__PURE__ */ jsx("p", { children: "LeetCode: paste it into \"About Me\". Codeforces: paste it into \"Organization\" (Settings)." })
									]
								}),
								[
									"leetcode",
									"codeforces",
									"kaggle"
								].map((platform) => /* @__PURE__ */ jsxs("div", {
									className: "grid grid-cols-[140px_1fr_auto] items-center gap-3",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "font-mono text-[12.5px] capitalize",
											children: platform
										}),
										/* @__PURE__ */ jsx("input", {
											placeholder: "your_handle",
											value: handles[platform],
											onChange: (e) => setHandles((h) => ({
												...h,
												[platform]: e.target.value
											})),
											className: "h-9 rounded border border-line bg-background px-3 font-mono text-[12.5px] focus:border-signal outline-none"
										}),
										/* @__PURE__ */ jsx("button", {
											onClick: () => verify(platform),
											className: "h-9 px-3 rounded border border-line font-mono text-[11.5px] hover:border-signal",
											children: "verify"
										})
									]
								}, platform)),
								/* @__PURE__ */ jsx("p", {
									className: "font-mono text-[11px] text-ink-muted mt-2",
									children: "Verification uses a one-time token pasted into your bio. It is not stored after verification."
								})
							]
						}),
						step === 2 && /* @__PURE__ */ jsxs("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ jsx("h2", {
									className: "text-xl font-semibold",
									children: "Optional resume upload"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-sm text-ink-muted",
									children: "We use it only to cross-check your GitHub skills. Nothing on your profile comes from the resume unless it is also present in your code."
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "border border-dashed border-line rounded-md p-8 text-center",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-mono text-[12px] text-ink-muted mb-2",
										children: "Drop a PDF here, or"
									}), /* @__PURE__ */ jsx("input", {
										type: "file",
										accept: "application/pdf",
										onChange: onResumeChosen,
										className: "font-mono text-[12px]"
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-8 flex justify-between items-center",
							children: [/* @__PURE__ */ jsx("button", {
								onClick: skip,
								className: "font-mono text-[12px] text-ink-muted hover:text-ink",
								children: "skip this step"
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex gap-2",
								children: [step > 0 && /* @__PURE__ */ jsx("button", {
									onClick: () => setStep(step - 1),
									className: "h-10 px-4 rounded border border-line font-mono text-[12.5px] hover:border-signal",
									children: "back"
								}), /* @__PURE__ */ jsx("button", {
									onClick: next,
									className: "h-10 px-4 rounded bg-signal text-signal-foreground font-mono text-[12.5px] hover:opacity-90",
									children: step === 2 ? "review & sync" : "continue →"
								})]
							})]
						})
					]
				})
			]
		})]
	});
}
//#endregion
export { Onboarding as component };
