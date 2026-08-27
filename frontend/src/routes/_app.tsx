import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/lib/queries";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/_app")({
  component: AuthGate,
});

function AuthGate() {
  const nav = useNavigate();
  const { data: user, isLoading, isError, error } = useCurrentUser();

  useEffect(() => {
    if (isError && error instanceof ApiError && error.status === 401) {
      nav({ to: "/auth/signin" });
    }
  }, [isError, error, nav]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-mono text-[12px] text-ink-muted">
          <span className="cursor-blink-forever">_</span> loading
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
