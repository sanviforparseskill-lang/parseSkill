import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile, useProjects, usePortfolio, usePublishPortfolio, useSkills, useUpdatePortfolio } from "@/lib/queries";
import { colorForCategory } from "@/lib/category-colors";
import { ConfidenceBar } from "@/components/brand/ConfidenceBar";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/portfolio")({ component: PortfolioEditor });

const THEMES = ["minimal", "terminal", "modern"] as const;

function PortfolioEditor() {
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: skills } = useSkills();
  const { data: portfolio } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const publishPortfolio = usePublishPortfolio();

  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("terminal");

  useEffect(() => {
    if (portfolio) {
      setSlug(portfolio.slug ?? "");
      if (THEMES.includes(portfolio.theme as (typeof THEMES)[number])) {
        setTheme(portfolio.theme as (typeof THEMES)[number]);
      }
    }
  }, [portfolio]);

  const published = portfolio?.is_public ?? false;

  const save = () => {
    updatePortfolio.mutate(
      { slug, theme },
      {
        onSuccess: () => toast.success("Portfolio updated"),
        onError: () => toast.error("Could not save portfolio"),
      },
    );
  };

  const togglePublish = () => {
    publishPortfolio.mutate(!published, {
      onSuccess: () => toast.success(!published ? "Published" : "Unpublished"),
      onError: () => toast.error("Could not update publish state"),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">portfolio editor</div>
          <h1 className="text-[28px] font-semibold mt-0.5">Your public page</h1>
        </div>
        <Link to="/u/$username" params={{ username: slug || profile?.github_handle || "" }} className="font-mono text-[12px] text-signal hover:underline inline-flex items-center gap-1">
          open live view <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Preview */}
        <div className="border border-line rounded-md bg-surface overflow-hidden">
          <div className="h-8 border-b border-line px-3 flex items-center font-mono text-[11px] text-ink-muted">
            parseskill.dev/@{slug || profile?.github_handle}
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-16 h-16 rounded-full border border-line bg-secondary" alt="" />
              ) : (
                <div className="w-16 h-16 rounded-full border border-line bg-secondary" />
              )}
              <div className="min-w-0">
                <div className="text-[20px] font-semibold">{profile?.display_name ?? profile?.github_handle}</div>
                <div className="font-mono text-[12px] text-ink-muted">{profile?.tagline}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded border border-proof px-1.5 py-0.5 text-proof font-mono text-[10px] tracking-widest">
                  VERIFIED BY parseSkill();
                </div>
              </div>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mt-6 mb-2">top projects</div>
            <div className="grid sm:grid-cols-3 gap-2">
              {(projects ?? []).slice(0, 3).map((p) => (
                <div key={p.id} className="border border-line rounded p-3">
                  <div className="font-mono text-[12px]">{p.repo_full_name}</div>
                  <div className="text-[12px] text-ink-muted line-clamp-2">{p.description}</div>
                </div>
              ))}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mt-6 mb-2">skills</div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
              {(skills ?? []).slice(0, 8).map((s) => (
                <div key={s.id} className="grid grid-cols-[100px_1fr] items-center gap-2 font-mono text-[11.5px]">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ background: colorForCategory(s.category) }} />
                    {s.name}
                  </span>
                  <ConfidenceBar value={s.confidence} showLabel={false} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <aside className="border border-line rounded-md bg-surface p-5 space-y-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">visibility</div>
            <label className="flex items-center gap-2 font-mono text-[12px]">
              <input type="checkbox" checked={published} onChange={togglePublish} className="accent-signal" />
              published (public URL is reachable)
            </label>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">custom slug</div>
            <div className="flex items-center h-9 border border-line rounded bg-background overflow-hidden">
              <span className="px-2 font-mono text-[12px] text-ink-muted">parseskill.dev/@</span>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 h-full bg-transparent font-mono text-[12.5px] outline-none pr-2" />
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-2">theme</div>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`border rounded p-2 text-left font-mono text-[11.5px] capitalize ${theme === t ? "border-signal" : "border-line hover:border-signal/50"}`}>
                  <div className="h-8 rounded mb-1" style={{
                    background: t === "minimal" ? "linear-gradient(90deg,#fff,#EEF0EC)" :
                      t === "terminal" ? "linear-gradient(90deg,#14171B,#262B31)" :
                      "linear-gradient(90deg,#F6F7F4,#3B6CE0)"
                  }} />
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} className="w-full h-10 rounded bg-signal text-signal-foreground font-mono text-[12.5px] hover:opacity-90">
            save changes
          </button>
        </aside>
      </div>
    </div>
  );
}
