import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, useNavigate,
  HeadContent, Scripts, ClientOnly,
} from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { completeNeonAuthSignIn, isNeonAuthConfigured } from "@/lib/neonAuth";

import appCss from "../styles.css?url";

/**
 * Neon Auth's Google OAuth flow lands the browser back wherever the
 * provider/project is configured to redirect (often the app's base URL,
 * not necessarily /auth/neon-callback) with a `neon_auth_session_verifier`
 * query param — see auth.neon-callback.tsx. This finishes that handshake
 * from any route so a mismatched redirect doesn't strand the user back on
 * the landing page with a session that never got exchanged.
 */
function NeonAuthVerifierBridge() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !isNeonAuthConfigured) return;
    if (!new URLSearchParams(window.location.search).has("neon_auth_session_verifier")) return;
    ran.current = true;
    (async () => {
      try {
        const { onboarded } = await completeNeonAuthSignIn();
        navigate({ to: onboarded ? "/dashboard" : "/onboarding" });
      } catch (err) {
        console.error("[NeonAuthVerifierBridge] completeNeonAuthSignIn failed:", err);
        const detail = err instanceof Error ? err.message : String(err);
        toast.error(`Could not complete Google sign-in: ${detail}`);
      }
    })();
  }, [navigate]);

  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl font-bold text-ink">404</h1>
        <p className="mt-3 font-mono text-sm text-ink-muted">
          No route matched. Nothing to prove here.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-ink">This page didn't load</h1>
        <p className="mt-2 text-sm text-ink-muted">Try again, or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-line bg-background px-4 py-2 text-sm text-ink hover:border-signal">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "parseSkill(); — Prove your skills with code, not checkboxes" },
      { name: "description", content: "Developer intelligence built from evidence. Every skill, score, and recommendation traces back to a real commit or file." },
      { property: "og:title", content: "parseSkill();" },
      { property: "og:description", content: "Prove your skills with code, not checkboxes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ClientOnly>
        <NeonAuthVerifierBridge />
      </ClientOnly>
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
  );
}
