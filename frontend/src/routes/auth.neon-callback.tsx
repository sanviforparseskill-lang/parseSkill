import { createFileRoute, useNavigate, ClientOnly } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { completeNeonAuthSignIn } from "@/lib/neonAuth";

export const Route = createFileRoute("/auth/neon-callback")({ component: NeonAuthCallback });

/**
 * Where Neon Auth's OAuth (Google) flow lands back after the provider
 * redirect. Exchanges the now-active Neon Auth session for our own
 * ps_access cookie, then continues into the app — see
 * components/auth/NeonAuthPanel.tsx.
 */
function NeonAuthCallback() {
  return (
    <ClientOnly fallback={<Loading />}>
      <NeonAuthCallbackInner />
    </ClientOnly>
  );
}

function NeonAuthCallbackInner() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const { onboarded } = await completeNeonAuthSignIn();
        navigate({ to: onboarded ? "/dashboard" : "/onboarding" });
      } catch {
        navigate({ to: "/auth/signin" });
      }
    })();
  }, [navigate]);

  return <Loading />;
}

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="font-mono text-[12px] text-ink-muted">
        <span className="cursor-blink-forever">_</span> loading
      </div>
    </div>
  );
}
