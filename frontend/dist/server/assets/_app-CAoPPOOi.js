import { t as cn } from "./utils-C_uf36nf.js";
import { t as ChatPanel } from "./ChatPanel-BxLtNBzb.js";
import { t as ApiError } from "./api-CdQxeiZX.js";
import { r as useCurrentUser } from "./queries-DP0lSQXe.js";
import { t as Wordmark } from "./Wordmark-Cp1gduGQ.js";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Bell, Boxes, ChevronsLeft, ChevronsRight, FileCheck2, Globe, LayoutDashboard, LineChart, Network, Route, Search, Settings, Sparkles, X } from "lucide-react";
//#region src/components/layout/AssistantLauncher.tsx
function AssistantLauncher() {
	const [open, setOpen] = useState(false);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("button", {
		onClick: () => setOpen(true),
		"aria-label": "Open AI assistant",
		className: cn("fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 h-11 w-11 grid place-items-center rounded-md", "bg-ink text-background border border-ink hover:bg-signal hover:border-signal transition-colors font-mono"),
		children: /* @__PURE__ */ jsx("span", {
			className: "text-lg leading-none cursor-blink-forever",
			children: "_"
		})
	}), open && /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex",
		children: [/* @__PURE__ */ jsx("button", {
			"aria-label": "Close",
			onClick: () => setOpen(false),
			className: "flex-1 bg-black/30"
		}), /* @__PURE__ */ jsxs("aside", {
			className: "w-full max-w-md h-full bg-surface border-l border-line flex flex-col",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "h-14 border-b border-line flex items-center justify-between px-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "font-mono text-[13px]",
					children: [/* @__PURE__ */ jsx("span", {
						className: "cursor-blink-forever",
						children: "_"
					}), " assistant"]
				}), /* @__PURE__ */ jsx("button", {
					onClick: () => setOpen(false),
					className: "p-1 hover:text-signal",
					children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "flex-1 min-h-0",
				children: /* @__PURE__ */ jsx(ChatPanel, { embedded: true })
			})]
		})]
	})] });
}
//#endregion
//#region src/components/layout/AppShell.tsx
var nav = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		to: "/graph",
		label: "Skill Graph",
		icon: Network
	},
	{
		to: "/projects",
		label: "Projects",
		icon: Boxes
	},
	{
		to: "/timeline",
		label: "Timeline",
		icon: LineChart
	},
	{
		to: "/recommendations",
		label: "Recommendations",
		icon: Sparkles
	},
	{
		to: "/resume-audit",
		label: "Resume Audit",
		icon: FileCheck2
	},
	{
		to: "/roadmap",
		label: "Roadmap",
		icon: Route
	},
	{
		to: "/portfolio",
		label: "Portfolio",
		icon: Globe
	},
	{
		to: "/settings",
		label: "Settings",
		icon: Settings
	}
];
function useTheme() {
	const [dark, setDark] = useState(false);
	useEffect(() => {
		const isDark = (typeof window !== "undefined" && localStorage.getItem("ps-theme")) === "dark";
		setDark(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);
	const toggle = () => {
		setDark((d) => {
			const next = !d;
			document.documentElement.classList.toggle("dark", next);
			localStorage.setItem("ps-theme", next ? "dark" : "light");
			return next;
		});
	};
	return {
		dark,
		toggle
	};
}
function AppShell({ children }) {
	const [collapsed, setCollapsed] = useState(false);
	const { dark, toggle } = useTheme();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { data: user } = useCurrentUser();
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background text-ink flex flex-col",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "sticky top-0 z-30 h-14 border-b border-line bg-surface/95 backdrop-blur flex items-center px-4 gap-4",
				children: [
					/* @__PURE__ */ jsx(Link, {
						to: "/dashboard",
						className: "flex items-center",
						children: /* @__PURE__ */ jsx(Wordmark, { className: "text-[15px]" })
					}),
					/* @__PURE__ */ jsx("div", {
						className: "hidden md:flex items-center gap-2 flex-1 max-w-xl",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 w-full h-9 border border-line rounded-md px-3 bg-background focus-within:border-signal",
							children: [
								/* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-ink-muted" }),
								/* @__PURE__ */ jsx("input", {
									className: "w-full bg-transparent outline-none font-mono text-[12.5px] placeholder:text-ink-muted",
									placeholder: "Search skills, projects, technologies"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "font-mono text-[10.5px] text-ink-muted border border-line rounded px-1 py-0.5",
									children: "⌘K"
								})
							]
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "ml-auto flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsxs("button", {
								"aria-label": "Toggle theme",
								onClick: toggle,
								className: "font-mono text-[11px] px-2 py-1 border border-line rounded hover:border-signal transition-colors",
								children: [
									"[ ",
									dark ? "light" : "dark",
									" ]"
								]
							}),
							/* @__PURE__ */ jsx("button", {
								className: "h-8 w-8 grid place-items-center border border-line rounded hover:border-signal",
								children: /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" })
							}),
							user?.avatar_url ? /* @__PURE__ */ jsx("img", {
								src: user.avatar_url,
								alt: "",
								className: "h-8 w-8 rounded-full border border-line bg-secondary"
							}) : /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-full border border-line bg-secondary" })
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-1 min-h-0",
				children: [/* @__PURE__ */ jsxs("aside", {
					className: cn("hidden md:flex sticky top-14 self-start h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-line bg-surface transition-[width]", collapsed ? "w-14" : "w-56"),
					children: [/* @__PURE__ */ jsx("nav", {
						className: "flex-1 py-3",
						children: nav.map((item) => {
							const active = pathname.startsWith(item.to);
							const Icon = item.icon;
							return /* @__PURE__ */ jsxs(Link, {
								to: item.to,
								className: cn("group relative flex items-center gap-3 h-10 px-3 mx-2 rounded text-[13.5px]", active ? "text-signal" : "text-ink-muted hover:text-ink"),
								children: [
									/* @__PURE__ */ jsx("span", { className: cn("absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r", active ? "bg-signal" : "bg-transparent") }),
									/* @__PURE__ */ jsx(Icon, { className: cn("h-4 w-4 shrink-0", active && "text-signal") }),
									!collapsed && /* @__PURE__ */ jsx("span", {
										className: "truncate",
										children: item.label
									})
								]
							}, item.to);
						})
					}), /* @__PURE__ */ jsx("button", {
						onClick: () => setCollapsed((c) => !c),
						className: "mx-2 mb-3 h-9 flex items-center justify-center gap-2 text-ink-muted hover:text-ink font-mono text-[11px] border border-line rounded",
						children: collapsed ? /* @__PURE__ */ jsx(ChevronsRight, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ChevronsLeft, { className: "h-4 w-4" }), " collapse"] })
					})]
				}), /* @__PURE__ */ jsx("main", {
					className: "flex-1 min-w-0",
					children
				})]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface grid grid-cols-5",
				children: nav.slice(0, 5).map((item) => {
					const active = pathname.startsWith(item.to);
					const Icon = item.icon;
					return /* @__PURE__ */ jsxs(Link, {
						to: item.to,
						className: cn("flex flex-col items-center justify-center py-2 gap-0.5", active ? "text-signal" : "text-ink-muted"),
						children: [/* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
							className: "text-[10px]",
							children: item.label.split(" ")[0]
						})]
					}, item.to);
				})
			}),
			/* @__PURE__ */ jsx(AssistantLauncher, {})
		]
	});
}
//#endregion
//#region src/routes/_app.tsx?tsr-split=component
function AuthGate() {
	const nav = useNavigate();
	const { data: user, isLoading, isError, error } = useCurrentUser();
	useEffect(() => {
		if (isError && error instanceof ApiError && error.status === 401) nav({ to: "/auth/signin" });
	}, [
		isError,
		error,
		nav
	]);
	if (isLoading) return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen grid place-items-center bg-background",
		children: /* @__PURE__ */ jsxs("div", {
			className: "font-mono text-[12px] text-ink-muted",
			children: [/* @__PURE__ */ jsx("span", {
				className: "cursor-blink-forever",
				children: "_"
			}), " loading"]
		})
	});
	if (!user) return null;
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
//#endregion
export { AuthGate as component };
