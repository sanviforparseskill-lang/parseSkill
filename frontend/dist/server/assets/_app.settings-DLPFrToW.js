import { n as api } from "./api-CdQxeiZX.js";
import { D as useUploadResume, E as useUpdateProfile, O as useVerificationToken, a as useLinkAccount, f as usePublishPortfolio, m as useResumeParse, n as useClearChatHistory, o as usePortfolio, s as useProfile, w as useUnlinkAccount } from "./queries-DP0lSQXe.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
//#region src/routes/_app.settings.tsx?tsr-split=component
function Section({ title, children }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "border border-line bg-surface rounded-md p-6",
		children: [/* @__PURE__ */ jsx("div", {
			className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
			children: title
		}), /* @__PURE__ */ jsx("div", {
			className: "mt-3",
			children
		})]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ jsxs("label", {
		className: "block mb-3",
		children: [/* @__PURE__ */ jsx("div", {
			className: "font-mono text-[11px] text-ink-muted mb-1",
			children: label
		}), children]
	});
}
var LINKABLE = [
	"leetcode",
	"codeforces",
	"kaggle"
];
function Settings() {
	const nav = useNavigate();
	const { data: profile } = useProfile();
	const updateProfile = useUpdateProfile();
	const linkAccount = useLinkAccount();
	const unlinkAccount = useUnlinkAccount();
	const uploadResume = useUploadResume();
	const clearChat = useClearChatHistory();
	const { data: portfolio } = usePortfolio();
	const publishPortfolio = usePublishPortfolio();
	const { data: verification } = useVerificationToken();
	const { data: resume } = useResumeParse();
	const [name, setName] = useState("");
	const [tagline, setTagline] = useState("");
	const [location, setLocation] = useState("");
	const [handles, setHandles] = useState({
		leetcode: "",
		codeforces: "",
		kaggle: ""
	});
	const [showSteps, setShowSteps] = useState({});
	useEffect(() => {
		if (profile) {
			setName(profile.display_name ?? "");
			setTagline(profile.tagline ?? "");
			setLocation(profile.location ?? "");
		}
	}, [profile]);
	const save = () => {
		updateProfile.mutate({
			display_name: name,
			tagline,
			location
		}, {
			onSuccess: () => toast.success("Profile saved"),
			onError: () => toast.error("Could not save profile")
		});
	};
	const link = (platform) => {
		const handle = handles[platform];
		if (!handle) return;
		linkAccount.mutate({
			platform,
			handle
		}, {
			onSuccess: () => {
				toast.success(`${platform} linked`);
				setShowSteps((s) => ({
					...s,
					[platform]: false
				}));
			},
			onError: (err) => toast.error(err instanceof Error ? err.message : `Could not link ${platform}`)
		});
	};
	const unlink = (platform) => {
		unlinkAccount.mutate(platform, {
			onSuccess: () => toast.success(`${platform} disconnected`),
			onError: () => toast.error(`Could not disconnect ${platform}`)
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
	const signOut = async () => {
		await api.post("/auth/signout");
		nav({ to: "/auth/signin" });
	};
	const linkedHandle = {
		leetcode: profile?.leetcode_handle ?? null,
		codeforces: profile?.codeforces_handle ?? null,
		kaggle: profile?.kaggle_handle ?? null
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "max-w-3xl mx-auto px-6 py-8 pb-24 space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted",
				children: "settings"
			}), /* @__PURE__ */ jsx("h1", {
				className: "text-[28px] font-semibold mt-0.5",
				children: "Account & data"
			})] }),
			/* @__PURE__ */ jsxs(Section, {
				title: "profile",
				children: [
					/* @__PURE__ */ jsx(Field, {
						label: "display name",
						children: /* @__PURE__ */ jsx("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							className: "w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] outline-none focus:border-signal"
						})
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "tagline",
						children: /* @__PURE__ */ jsx("input", {
							value: tagline,
							onChange: (e) => setTagline(e.target.value),
							className: "w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] outline-none focus:border-signal"
						})
					}),
					/* @__PURE__ */ jsx(Field, {
						label: "location",
						children: /* @__PURE__ */ jsx("input", {
							value: location,
							onChange: (e) => setLocation(e.target.value),
							className: "w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] outline-none focus:border-signal"
						})
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: save,
						className: "mt-2 h-9 px-3 rounded bg-signal text-signal-foreground font-mono text-[12px]",
						children: "save"
					})
				]
			}),
			/* @__PURE__ */ jsx(Section, {
				title: "linked accounts",
				children: /* @__PURE__ */ jsxs("div", {
					className: "divide-y divide-line",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "py-3 flex items-center justify-between font-mono text-[12.5px]",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", { children: "GitHub" }), /* @__PURE__ */ jsxs("div", {
							className: "text-[11px] text-ink-muted",
							children: [
								"@",
								profile?.github_handle,
								" · last sync · ",
								profile?.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : "never"
							]
						})] }), /* @__PURE__ */ jsx("span", {
							className: "px-3 h-8 border rounded text-[11.5px] border-proof text-proof inline-flex items-center",
							children: "connected"
						})]
					}), LINKABLE.map((platform) => {
						const connected = !!linkedHandle[platform];
						const needsVerification = platform === "leetcode" || platform === "codeforces";
						return /* @__PURE__ */ jsxs("div", {
							className: "py-3 font-mono text-[12.5px]",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ jsx("div", {
									className: "capitalize",
									children: platform
								}), connected ? /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "text-[11px] text-ink-muted",
										children: linkedHandle[platform]
									}), /* @__PURE__ */ jsx("button", {
										onClick: () => unlink(platform),
										className: "px-3 h-8 border rounded text-[11.5px] border-proof text-proof",
										children: "disconnect"
									})]
								}) : /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ jsx("input", {
											placeholder: "handle",
											value: handles[platform],
											onChange: (e) => setHandles((h) => ({
												...h,
												[platform]: e.target.value
											})),
											className: "h-8 w-32 rounded border border-line bg-background px-2 font-mono text-[11.5px] outline-none focus:border-signal"
										}),
										needsVerification && /* @__PURE__ */ jsx("button", {
											onClick: () => setShowSteps((s) => ({
												...s,
												[platform]: !s[platform]
											})),
											className: "px-2 h-8 font-mono text-[11px] text-ink-muted hover:text-ink underline underline-offset-2",
											children: showSteps[platform] ? "hide steps" : "how to verify"
										}),
										/* @__PURE__ */ jsx("button", {
											onClick: () => link(platform),
											disabled: linkAccount.isPending,
											className: "px-3 h-8 border rounded text-[11.5px] border-line hover:border-signal disabled:opacity-50",
											children: linkAccount.isPending ? "connecting…" : "connect"
										})
									]
								})]
							}), !connected && needsVerification && showSteps[platform] && /* @__PURE__ */ jsxs("div", {
								className: "mt-2 p-3 rounded border border-line bg-background text-[11.5px] text-ink-muted space-y-2",
								children: [
									/* @__PURE__ */ jsx("p", { children: verification?.instructions[platform] ?? "Loading…" }),
									verification?.token && /* @__PURE__ */ jsxs("div", {
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
									/* @__PURE__ */ jsx("p", { children: "Once it's on your public profile, come back and click connect." })
								]
							})]
						}, platform);
					})]
				})
			}),
			/* @__PURE__ */ jsx(Section, {
				title: "data & privacy",
				children: /* @__PURE__ */ jsx("div", {
					className: "space-y-3",
					children: /* @__PURE__ */ jsxs("label", {
						className: "flex items-center gap-2 font-mono text-[12px]",
						children: [
							/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								checked: portfolio?.is_public ?? false,
								onChange: (e) => publishPortfolio.mutate(e.target.checked),
								className: "accent-signal"
							}),
							" portfolio publicly visible at /@",
							portfolio?.slug ?? profile?.github_handle
						]
					})
				})
			}),
			/* @__PURE__ */ jsxs(Section, {
				title: "resume",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-[13px] text-ink-muted mb-2",
						children: "Parsed and kept so you can see what was extracted. Claimed skills that also show up as GitHub-evidenced are marked confirmed below — nothing here overrides or adds to your inferred skills on its own."
					}),
					/* @__PURE__ */ jsx("input", {
						type: "file",
						accept: "application/pdf",
						onChange: onResumeChosen,
						disabled: uploadResume.isPending,
						className: "font-mono text-[12px]"
					}),
					uploadResume.isPending && /* @__PURE__ */ jsx("p", {
						className: "mt-2 font-mono text-[11.5px] text-ink-muted",
						children: "parsing…"
					}),
					resume && (resume.skills_claimed.length > 0 || resume.education.length > 0 || resume.work_experience.length > 0) && /* @__PURE__ */ jsxs("div", {
						className: "mt-4 space-y-3",
						children: [
							resume.parsed_at && /* @__PURE__ */ jsxs("div", {
								className: "font-mono text-[11px] text-ink-muted",
								children: ["last parsed ", new Date(resume.parsed_at).toLocaleString()]
							}),
							resume.skills_claimed.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5",
								children: "skills claimed"
							}), /* @__PURE__ */ jsx("div", {
								className: "flex flex-wrap gap-1.5",
								children: resume.skills_claimed.map((s) => {
									const confirmed = resume.corroborated_skills.includes(s);
									return /* @__PURE__ */ jsxs("span", {
										className: `font-mono text-[11px] px-2 py-1 rounded border ${confirmed ? "border-proof text-proof" : "border-line text-ink-muted"}`,
										title: confirmed ? "Also evidenced in your GitHub code" : "Not yet evidenced in your GitHub code",
										children: [confirmed ? "✓ " : "", s]
									}, s);
								})
							})] }),
							resume.work_experience.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5",
								children: "work experience"
							}), /* @__PURE__ */ jsx("ul", {
								className: "space-y-1 font-mono text-[12px] text-ink-muted",
								children: resume.work_experience.map((w, i) => /* @__PURE__ */ jsxs("li", { children: [
									w.title ?? "?",
									" · ",
									w.company ?? "?",
									" ",
									w.start_date ? `(${w.start_date} – ${w.end_date ?? "present"})` : ""
								] }, i))
							})] }),
							resume.education.length > 0 && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
								className: "font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5",
								children: "education"
							}), /* @__PURE__ */ jsx("ul", {
								className: "space-y-1 font-mono text-[12px] text-ink-muted",
								children: resume.education.map((e, i) => /* @__PURE__ */ jsxs("li", { children: [
									e.degree ?? "?",
									" ",
									e.field ? `in ${e.field}` : "",
									" · ",
									e.institution ?? "?",
									" ",
									e.year ? `(${e.year})` : ""
								] }, i))
							})] })
						]
					})
				]
			}),
			/* @__PURE__ */ jsx(Section, {
				title: "ai assistant",
				children: /* @__PURE__ */ jsx("button", {
					onClick: () => clearChat.mutate(void 0, { onSuccess: () => toast.success("Chat history cleared") }),
					className: "h-9 px-3 rounded border border-line font-mono text-[12px] hover:border-signal",
					children: "clear chat history"
				})
			}),
			/* @__PURE__ */ jsx(Section, {
				title: "session",
				children: /* @__PURE__ */ jsx("button", {
					onClick: signOut,
					className: "h-9 px-3 rounded border border-line font-mono text-[12px] hover:border-signal",
					children: "sign out"
				})
			})
		]
	});
}
//#endregion
export { Settings as component };
