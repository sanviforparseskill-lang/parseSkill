import { t as Route$17 } from "./u._username-B3oAgqVg.js";
import { ClientOnly, HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
//#region src/styles.css?url
var styles_default = "/assets/styles-CVCsrhns.css";
//#endregion
//#region src/routes/__root.tsx
/**
* Neon Auth's Google OAuth flow lands the browser back wherever the
* provider/project is configured to redirect (often the app's base URL,
* not necessarily /auth/neon-callback) with a `neon_auth_session_verifier`
* query param — see auth.neon-callback.tsx. This finishes that handshake
* from any route so a mismatched redirect doesn't strand the user back on
* the landing page with a session that never got exchanged.
*/
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "font-display text-6xl font-bold text-ink",
					children: "404"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 font-mono text-sm text-ink-muted",
					children: "No route matched. Nothing to prove here."
				}),
				/* @__PURE__ */ jsx(Link, {
					to: "/",
					className: "mt-6 inline-flex items-center justify-center rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground hover:opacity-90",
					children: "Go home"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	const router = useRouter();
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold text-ink",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-ink-muted",
					children: "Try again, or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground hover:opacity-90",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "rounded-md border border-line bg-background px-4 py-2 text-sm text-ink hover:border-signal",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$16 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "parseSkill(); — Prove your skills with code, not checkboxes" },
			{
				name: "description",
				content: "Developer intelligence built from evidence. Every skill, score, and recommendation traces back to a real commit or file."
			},
			{
				property: "og:title",
				content: "parseSkill();"
			},
			{
				property: "og:description",
				content: "Prove your skills with code, not checkboxes."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [children, /* @__PURE__ */ jsx(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$16.useRouteContext();
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ jsx(ClientOnly, {}),
			/* @__PURE__ */ jsx(Outlet, {}),
			/* @__PURE__ */ jsx(Toaster, {
				richColors: true,
				position: "bottom-right"
			})
		]
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$15 = () => import("./routes-KFoKocY8.js");
var Route$15 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$15, "component") });
//#endregion
//#region src/routes/_app.tsx
var $$splitComponentImporter$14 = () => import("./_app-CAoPPOOi.js");
var Route$14 = createFileRoute("/_app")({ component: lazyRouteComponent($$splitComponentImporter$14, "component") });
//#endregion
//#region src/routes/about.tsx
var $$splitComponentImporter$13 = () => import("./about-C4gLgmHe.js");
var Route$13 = createFileRoute("/about")({
	head: () => ({ meta: [{ title: "How parseSkill(); scores you — Methodology & data" }, {
		name: "description",
		content: "Published scoring formulas, data sources, and accuracy metrics for every claim on parseSkill();."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
//#endregion
//#region src/routes/onboarding.tsx
var $$splitComponentImporter$12 = () => import("./onboarding-zj_uYIYb.js");
var Route$12 = createFileRoute("/onboarding")({ component: lazyRouteComponent($$splitComponentImporter$12, "component") });
//#endregion
//#region src/routes/_app.chat.tsx
var $$splitComponentImporter$11 = () => import("./_app.chat-DrK-tj1G.js");
var Route$11 = createFileRoute("/_app/chat")({ component: lazyRouteComponent($$splitComponentImporter$11, "component") });
//#endregion
//#region src/routes/_app.dashboard.tsx
var $$splitComponentImporter$10 = () => import("./_app.dashboard-DNymm-D9.js");
var Route$10 = createFileRoute("/_app/dashboard")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
//#endregion
//#region src/routes/_app.graph.tsx
var $$splitComponentImporter$9 = () => import("./_app.graph-B86suaUS.js");
var Route$9 = createFileRoute("/_app/graph")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
//#endregion
//#region src/routes/_app.portfolio.tsx
var $$splitComponentImporter$8 = () => import("./_app.portfolio-BpyEYe2y.js");
var Route$8 = createFileRoute("/_app/portfolio")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
//#endregion
//#region src/routes/_app.projects.tsx
var $$splitComponentImporter$7 = () => import("./_app.projects-CGc3C6D8.js");
var Route$7 = createFileRoute("/_app/projects")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
//#endregion
//#region src/routes/_app.recommendations.tsx
var $$splitComponentImporter$6 = () => import("./_app.recommendations-DYKMJwto.js");
var Route$6 = createFileRoute("/_app/recommendations")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
//#endregion
//#region src/routes/_app.resume-audit.tsx
var $$splitComponentImporter$5 = () => import("./_app.resume-audit-B8a_2OFb.js");
var Route$5 = createFileRoute("/_app/resume-audit")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
//#endregion
//#region src/routes/_app.roadmap.tsx
var $$splitComponentImporter$4 = () => import("./_app.roadmap-CmKpaFR1.js");
var Route$4 = createFileRoute("/_app/roadmap")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
//#endregion
//#region src/routes/_app.settings.tsx
var $$splitComponentImporter$3 = () => import("./_app.settings-DLPFrToW.js");
var Route$3 = createFileRoute("/_app/settings")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
//#endregion
//#region src/routes/_app.timeline.tsx
var $$splitComponentImporter$2 = () => import("./_app.timeline-9BjW_0sH.js");
var Route$2 = createFileRoute("/_app/timeline")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
//#endregion
//#region src/routes/auth.neon-callback.tsx
var $$splitComponentImporter$1 = () => import("./auth.neon-callback-y9bpc8ZC.js");
var Route$1 = createFileRoute("/auth/neon-callback")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
/**
* Where Neon Auth's OAuth (Google) flow lands back after the provider
* redirect. Exchanges the now-active Neon Auth session for our own
* ps_access cookie, then continues into the app — see
* components/auth/NeonAuthPanel.tsx.
*/
//#endregion
//#region src/routes/auth.signin.tsx
var $$splitComponentImporter = () => import("./auth.signin-CCCX8TWf.js");
var Route = createFileRoute("/auth/signin")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
//#endregion
//#region src/routeTree.gen.ts
var IndexRoute = Route$15.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$16
});
var AppRoute = Route$14.update({
	id: "/_app",
	getParentRoute: () => Route$16
});
var AboutRoute = Route$13.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$16
});
var OnboardingRoute = Route$12.update({
	id: "/onboarding",
	path: "/onboarding",
	getParentRoute: () => Route$16
});
var AppChatRoute = Route$11.update({
	id: "/chat",
	path: "/chat",
	getParentRoute: () => AppRoute
});
var AppDashboardRoute = Route$10.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AppRoute
});
var AppGraphRoute = Route$9.update({
	id: "/graph",
	path: "/graph",
	getParentRoute: () => AppRoute
});
var AppPortfolioRoute = Route$8.update({
	id: "/portfolio",
	path: "/portfolio",
	getParentRoute: () => AppRoute
});
var AppProjectsRoute = Route$7.update({
	id: "/projects",
	path: "/projects",
	getParentRoute: () => AppRoute
});
var AppRecommendationsRoute = Route$6.update({
	id: "/recommendations",
	path: "/recommendations",
	getParentRoute: () => AppRoute
});
var AppResumeAuditRoute = Route$5.update({
	id: "/resume-audit",
	path: "/resume-audit",
	getParentRoute: () => AppRoute
});
var AppRoadmapRoute = Route$4.update({
	id: "/roadmap",
	path: "/roadmap",
	getParentRoute: () => AppRoute
});
var AppSettingsRoute = Route$3.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AppRoute
});
var AppTimelineRoute = Route$2.update({
	id: "/timeline",
	path: "/timeline",
	getParentRoute: () => AppRoute
});
var AuthNeonCallbackRoute = Route$1.update({
	id: "/auth/neon-callback",
	path: "/auth/neon-callback",
	getParentRoute: () => Route$16
});
var AuthSigninRoute = Route.update({
	id: "/auth/signin",
	path: "/auth/signin",
	getParentRoute: () => Route$16
});
var UUsernameRoute = Route$17.update({
	id: "/u/$username",
	path: "/u/$username",
	getParentRoute: () => Route$16
});
var AppRouteChildren = {
	AppChatRoute,
	AppDashboardRoute,
	AppGraphRoute,
	AppPortfolioRoute,
	AppProjectsRoute,
	AppRecommendationsRoute,
	AppResumeAuditRoute,
	AppRoadmapRoute,
	AppSettingsRoute,
	AppTimelineRoute
};
var rootRouteChildren = {
	IndexRoute,
	AppRoute: AppRoute._addFileChildren(AppRouteChildren),
	AboutRoute,
	OnboardingRoute,
	AuthNeonCallbackRoute,
	AuthSigninRoute,
	UUsernameRoute
};
var routeTree = Route$16._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
