import { createFileRoute, Link } from "@tanstack/react-router";
import { usePublicPortfolio } from "@/lib/queries";
import { Wordmark } from "@/components/brand/Wordmark";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Verified developer portfolio · parseSkill();` },
      { property: "og:title", content: `@${params.username} — verified developer` },
    ],
  }),
  component: Public,
});

function Public() {
  const { username } = Route.useParams();
  const { data: portfolio, isLoading, isError } = usePublicPortfolio(username);

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="h-14 border-b border-line px-6 flex items-center justify-between bg-surface">
        <Link to="/"><Wordmark className="text-[13px]" /></Link>
        <Link to="/auth/signin" className="font-mono text-[12px] text-signal hover:underline">make yours →</Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {isLoading && <p className="text-[13.5px] text-ink-muted">Loading…</p>}
        {isError && (
          <p className="text-[13.5px] text-ink-muted">
            This portfolio isn't public, or @{username} hasn't published one yet.
          </p>
        )}
        {portfolio && (
          <>
            {/* Hero */}
            <div className="flex items-center gap-5">
              {portfolio.avatar_url ? (
                <img src={portfolio.avatar_url} className="w-20 h-20 rounded-full border border-line bg-secondary" alt="" />
              ) : (
                <div className="w-20 h-20 rounded-full border border-line bg-secondary" />
              )}
              <div className="min-w-0">
                <h1 className="text-[32px] font-semibold leading-tight">{portfolio.display_name ?? portfolio.handle}</h1>
                <p className="text-[15px] text-ink-muted">{portfolio.tagline}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded border border-proof px-2 py-0.5 text-proof font-mono text-[10.5px] tracking-widest">
                    ✓ VERIFIED BY parseSkill();
                  </span>
                  <span className="font-mono text-[11px] text-ink-muted">@{portfolio.handle}</span>
                </div>
              </div>
            </div>

            {/* Top projects */}
            {portfolio.top_projects.length > 0 && (
              <section className="mt-12">
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">top projects</div>
                <div className="mt-3 grid sm:grid-cols-3 gap-3">
                  {portfolio.top_projects.map((p) => (
                    <div key={p.repo_full_name} className="border border-line rounded-md p-4 bg-surface">
                      <div className="font-mono text-[12.5px] font-semibold">{p.repo_full_name}</div>
                      <p className="text-[13px] text-ink-muted mt-1 line-clamp-3">{p.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Career fit */}
            {portfolio.top_role && (
              <section className="mt-12">
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">career fit</div>
                <p className="mt-2 text-[15px] leading-7">
                  Strongest fit for <span className="font-semibold">{portfolio.top_role.role_name}</span> ({Math.round(portfolio.top_role.confidence * 100)}%).
                </p>
              </section>
            )}

            {/* Contact */}
            <section className="mt-12 pt-8 border-t border-line flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[12px] text-ink-muted">github.com/{portfolio.handle}</div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
