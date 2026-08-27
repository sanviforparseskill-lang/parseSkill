import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { apiOrigin } from "@/lib/api";
import { NeonAuthPanel } from "@/components/auth/NeonAuthPanel";
import { isNeonAuthConfigured } from "@/lib/neonAuth";

export const Route = createFileRoute("/auth/signin")({ component: SignIn });

function SignIn() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b border-line px-6 flex items-center bg-surface">
        <Link to="/"><Wordmark className="text-[15px]" /></Link>
      </header>
      <div className="flex-1 grid place-items-center px-4">
        <div className="w-full max-w-md border border-line bg-surface rounded-md p-8">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">sign in</div>
          <h1 className="mt-1 text-2xl font-semibold">Continue with GitHub</h1>
          <p className="mt-2 text-[13.5px] text-ink-muted leading-6">
            We request <span className="font-mono text-ink">read access to public repositories</span> only.
            No writes, no private code, no email. You can revoke access from GitHub at any time.
          </p>
          <a
            href={`${apiOrigin()}/auth/signin/github`}
            className="mt-6 w-full h-11 rounded-md bg-signal text-signal-foreground font-medium hover:opacity-90 inline-flex items-center justify-center gap-2"
          >
            <Github className="h-4 w-4" /> Continue with GitHub
          </a>
          <div className="mt-6 border-t border-dashed border-line pt-4 font-mono text-[11px] text-ink-muted">
            scopes requested: <span className="text-ink">public_repo, read:user</span>
          </div>

          {isNeonAuthConfigured && (
            <div className="mt-6">
              <ClientOnly>
                <NeonAuthPanel />
              </ClientOnly>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
