import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { SyncLog } from "@/components/brand/SyncLog";
import { ConfidenceBar } from "@/components/brand/ConfidenceBar";
import { Receipt } from "@/components/brand/Receipt";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="h-14 border-b border-line px-6 flex items-center justify-between bg-surface">
        <Wordmark blink className="text-[15px]" />
        <nav className="flex items-center gap-4 font-mono text-[12px] text-ink-muted">
          <Link to="/about" className="hover:text-ink">about</Link>
          <a href="#how" className="hover:text-ink">how it works</a>
          <a href="#scoring" className="hover:text-ink">scoring</a>
          <Link to="/auth/signin" className="text-signal hover:opacity-90">sign in →</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-4">
            developer intelligence, evidence-based
          </div>
          <h1 className="font-display font-bold leading-[1.02] text-[52px] lg:text-[56px] tracking-tight">
            Prove your skills<br />with code.<br />
            <span className="text-ink-muted">Not checkboxes.</span>
          </h1>
          <p className="mt-6 text-[15px] leading-7 text-ink-muted max-w-lg">
            Every skill, score, and role recommendation on parseSkill(); traces back to a real commit,
            file, or contest submission. Nothing is self-reported. You get a portfolio your commits earned.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth/signin"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-md bg-signal text-signal-foreground text-[14px] font-medium hover:opacity-90"
            >
              <Github className="h-4 w-4" /> Continue with GitHub
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 h-11 px-4 rounded-md border border-line text-[14px] hover:border-signal"
            >
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 font-mono text-[11.5px] text-ink-muted">
            read-access to public repos only · no writes · no background scraping
          </p>
        </div>

        {/* Terminal demo */}
        <div className="relative">
          <div className="rounded-md border border-line overflow-hidden bg-surface">
            <div className="h-8 border-b border-line px-3 flex items-center gap-2 font-mono text-[11px] text-ink-muted">
              <span className="w-2 h-2 rounded-full bg-gap" />
              <span className="w-2 h-2 rounded-full bg-cat-frontend" style={{ background: "#F2B84E" }} />
              <span className="w-2 h-2 rounded-full bg-proof" />
              <span className="ml-2">parseSkill://scan</span>
            </div>
            <SyncLog
              className="rounded-none border-0 h-64"
              lines={[
                { text: "$ parseSkill scan --user=you", tone: "info" },
                { text: "→ reading 12 public repositories…" },
                { text: "→ parsing 4,271 commits across Python, TypeScript, Go" },
                { text: "→ inferring skills from AST + commit ownership" },
                { text: "detected: FastAPI          confidence 0.91", tone: "ok" },
                { text: "detected: PostgreSQL       confidence 0.88", tone: "ok" },
                { text: "detected: Docker           confidence 0.86", tone: "ok" },
                { text: "detected: Kubernetes       confidence 0.78", tone: "ok" },
                { text: "→ generating receipts…" },
                { text: "✓ 3 evidenced skills verified", tone: "ok" },
              ]}
            />
          </div>
          <div className="mt-4 grid gap-2">
            {[
              { name: "FastAPI", pct: 0.91 },
              { name: "PostgreSQL", pct: 0.88 },
              { name: "Kubernetes", pct: 0.78 },
            ].map((s) => (
              <div key={s.name} className="grid grid-cols-[120px_1fr] items-center gap-3 font-mono text-[12px]">
                <span>{s.name}</span>
                <ConfidenceBar value={s.pct} size="md" />
              </div>
            ))}
          </div>
          <div className="absolute -right-4 -bottom-4 hidden lg:block w-72">
            <Receipt
              title="FastAPI · confidence 0.91"
              animate={false}
              items={[
                { label: "orbit-api", value: "812 commits" },
                { label: "ledger-svc", value: "204 commits" },
                { label: "test coverage", value: "83% avg" },
                { label: "arch patterns", value: "layered, DI" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">how it works</h2>
          <div className="mt-6 grid md:grid-cols-4 gap-6">
            {[
              ["01", "Connect", "GitHub, plus optional LeetCode, Codeforces, Kaggle."],
              ["02", "Analyze", "Static analysis + commit weighting on every non-fork repo."],
              ["03", "Discover", "Skills, scores, and role fits — each with an evidence receipt."],
              ["04", "Share", "Publish a verified portfolio at parseskill.dev/@you."],
            ].map(([n, t, d]) => (
              <div key={n} className="border-t border-line pt-4">
                <div className="font-mono text-[11px] text-ink-muted">{n}</div>
                <h3 className="mt-1 text-[16px] font-semibold">{t}</h3>
                <p className="mt-2 text-[13.5px] text-ink-muted leading-6">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section id="scoring" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">how we score you</h2>
        <div className="mt-4 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <h3 className="text-[26px] font-semibold leading-tight">Every confidence score is a formula. No black box.</h3>
            <p className="mt-3 text-ink-muted text-[15px] leading-7">
              A skill's confidence is the weighted sum of commits, code ownership, repo complexity,
              and recency. We publish the equation, its weights, and the evidence receipt behind every number.
            </p>
            <Link to="/about" className="mt-4 inline-flex items-center gap-1 text-signal font-mono text-[12.5px] hover:underline">
              full methodology <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <pre className="bg-surface border border-line rounded-md p-6 font-mono text-[12.5px] leading-6 overflow-x-auto">
{`confidence(skill) =
  0.35 · normalized(commits_touching_skill)
+ 0.25 · avg(contribution_weight_in_repos)
+ 0.20 · avg(project_complexity)
+ 0.15 · recency_decay(last_commit)
+ 0.05 · presence_in_ci_or_tests`}
          </pre>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-y border-line bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">what you get</h2>
          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {[
              ["Skill Graph", "Every technology and skill as a node, sized by evidence, linked by project."],
              ["Project Analysis", "Complexity, patterns, and ownership computed per repo."],
              ["Evolution Timeline", "See when each skill entered your work and how it grew."],
              ["Role Recommendations", "~25 roles matched to your evidence, with strengths and gaps listed."],
              ["Personalized Roadmap", "A prerequisite-aware learning path to close the gap to a target role."],
              ["Grounded AI Assistant", "Every answer cites the receipts it drew from — no hallucinated resume."],
              ["Public Verified Portfolio", "A shareable, evidence-linked page at parseskill.dev/@you."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-line pt-4">
                <h3 className="text-[15px] font-semibold">{t}</h3>
                <p className="mt-1 text-[13.5px] text-ink-muted leading-6">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample portfolio embed */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">a sample portfolio</h2>
        <div className="mt-4 border border-line rounded-md bg-surface overflow-hidden">
          <div className="h-8 border-b border-line px-3 flex items-center font-mono text-[11px] text-ink-muted">
            parseskill.dev/@mayaokafor
          </div>
          <div className="p-6 grid md:grid-cols-[1fr_1.4fr] gap-8">
            <div>
              <div className="text-[20px] font-semibold">Maya Okafor</div>
              <div className="font-mono text-[12px] text-ink-muted">Backend + platform engineer, learning ML in production.</div>
              <div className="mt-3 inline-flex items-center gap-1 rounded border border-proof px-1.5 py-0.5 text-proof font-mono text-[10px] tracking-widest">
                VERIFIED · 20 skills · 8 repos
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["FastAPI", 0.91], ["PostgreSQL", 0.88],
                ["Docker", 0.86], ["Kubernetes", 0.78],
                ["Terraform", 0.74], ["XGBoost", 0.68],
              ].map(([n, p]) => (
                <div key={n as string} className="grid grid-cols-[90px_1fr] items-center gap-2 font-mono text-[11.5px]">
                  <span>{n as string}</span>
                  <ConfidenceBar value={p as number} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-line bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">frequently asked</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {[
              ["What do you actually read from my GitHub?", "Public repository contents, commit history authored by you, and file paths. We never request write access, private repos, or your email."],
              ["Is my data sold or shared?", "No. Aggregate role-fit models are trained on public datasets (Tabiya ESCO, Kaggle LinkedIn Jobs, Stack Overflow Survey). Your data stays yours."],
              ["How often does it re-sync?", "Manually, from your dashboard. There is no background scraper. You are always in control of when new evidence enters your profile."],
              ["Can I hide a project?", "Yes. Each project has a visibility toggle. Confidence scores still recompute honestly from what remains."],
            ].map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <span className="font-medium text-[15px]">{q}</span>
                  <span className="font-mono text-ink-muted group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-2 text-[14px] text-ink-muted leading-7">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4 font-mono text-[12px] text-ink-muted">
        <Wordmark className="text-[13px]" />
        <nav className="flex gap-4">
          <Link to="/about" className="hover:text-ink">about</Link>
          <a href="#" className="hover:text-ink">docs</a>
          <a href="#" className="hover:text-ink">github</a>
          <a href="#" className="hover:text-ink">contact</a>
        </nav>
      </footer>
    </div>
  );
}
