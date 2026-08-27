import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/u.$username.tsx
var $$splitComponentImporter = () => import("./u._username-CCq_2GXR.js");
var Route = createFileRoute("/u/$username")({
	head: ({ params }) => ({ meta: [{ title: `@${params.username} — Verified developer portfolio · parseSkill();` }, {
		property: "og:title",
		content: `@${params.username} — verified developer`
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
