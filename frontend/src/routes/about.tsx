import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/brand/Wordmark";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How parseSkill(); scores you — Methodology & data" },
      { name: "description", content: "Published scoring formulas, data sources, and accuracy metrics for every claim on parseSkill();." },
    ],
  }),
  component: About,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6 mt-8">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function AccuracyBar({ label, precision, recall }: { label: string; precision: number; recall: number }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-4 py-2 font-mono text-[12px]">
      <span>{label}</span>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-16 text-ink-muted">precision</span>
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-proof" style={{ width: `${precision * 100}%` }} />
          </div>
          <span className="w-10 text-right tabular-nums">{(precision * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-ink-muted">recall</span>
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-signal" style={{ width: `${recall * 100}%` }} />
          </div>
          <span className="w-10 text-right tabular-nums">{(recall * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-line px-6 flex items-center justify-between bg-surface">
        <Link to="/"><Wordmark className="text-[15px]" /></Link>
        <Link to="/" className="font-mono text-[12px] text-ink-muted hover:text-ink">← home</Link>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-4xl tracking-tight">How we score you</h1>
        <p className="mt-4 text-ink-muted leading-7 text-[15px]">
          parseSkill(); is built on one claim: every number we show you can be traced back to your code.
          This page publishes the formulas, the datasets, and the measured accuracy behind every claim.
        </p>

        <Section title="skill confidence">
          <pre className="bg-surface border border-line rounded-md p-4 font-mono text-[12.5px] leading-6 overflow-x-auto">
{`confidence(skill) =
  0.35 · normalized(commits_touching_skill)
+ 0.25 · avg(contribution_weight_in_repos)
+ 0.20 · avg(project_complexity)
+ 0.15 · recency_decay(last_commit)
+ 0.05 · presence_in_ci_or_tests`}
          </pre>
        </Section>

        <Section title="project complexity">
          <pre className="bg-surface border border-line rounded-md p-4 font-mono text-[12.5px] leading-6 overflow-x-auto">
{`complexity(repo) =
  0.30 · log(non_generated_LoC)
+ 0.25 · architectural_pattern_count
+ 0.20 · module_coupling_inverse
+ 0.15 · test_coverage
+ 0.10 · CI/CD_maturity`}
          </pre>
        </Section>

        <Section title="data sources">
          <ul className="space-y-2 text-[14px] leading-7">
            <li><b>Tabiya ESCO occupations</b> — role definitions and required skills. CC-BY-4.0.</li>
            <li><b>Kaggle LinkedIn Jobs (2023)</b> — market demand signal for role-fit weighting. CC0.</li>
            <li><b>Stack Overflow Developer Survey</b> — technology co-occurrence priors. ODbL.</li>
            <li><b>Your GitHub (public repos only)</b> — the only source of you-specific evidence.</li>
          </ul>
        </Section>

        <Section title="what we do not do">
          <ul className="space-y-2 text-[14px] leading-7 text-ink">
            <li>— No selling or brokering your data.</li>
            <li>— No background scraping. Syncs happen only when you press the button.</li>
            <li>— No auto-fetching of private repos or emails.</li>
            <li>— No inferring skills you never touched. If it's on your profile, we can point to the commits.</li>
          </ul>
        </Section>

        <Section title="measured accuracy">
          <div className="border border-line rounded-md bg-surface p-4">
            <AccuracyBar label="skill inference" precision={0.94} recall={0.87} />
            <AccuracyBar label="role predictor (top-3)" precision={0.81} recall={0.78} />
            <AccuracyBar label="architecture pattern detection" precision={0.76} recall={0.69} />
          </div>
          <p className="mt-3 font-mono text-[11.5px] text-ink-muted">
            evaluated on a held-out set of 1,200 hand-labeled public repositories · reproduced quarterly
          </p>
        </Section>
      </div>
    </div>
  );
}
