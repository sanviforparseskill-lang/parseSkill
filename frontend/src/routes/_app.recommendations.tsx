import { createFileRoute } from "@tanstack/react-router";
import { useProjectIdeas, useRolePredictions, useSkillGap } from "@/lib/queries";
import { RoleFitCard } from "@/components/brand/RoleFitCard";
import { Receipt } from "@/components/brand/Receipt";
import { ConfidenceBar } from "@/components/brand/ConfidenceBar";

export const Route = createFileRoute("/_app/recommendations")({ component: Rec });

function Rec() {
  const { data: roles } = useRolePredictions();
  const list = roles ?? [];
  const top = list.slice(0, 3);
  const rest = list.slice(3);
  const topRoleId = top[0]?.role_id ?? null;
  const { data: gap } = useSkillGap(topRoleId);
  const { data: projectIdeas } = useProjectIdeas();

  const gapSkills = (gap ?? []).filter((g) => !g.already_have);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">recommendations</div>
        <h1 className="text-[28px] font-semibold mt-0.5">Roles matched to your evidence</h1>
        <p className="text-[14px] text-ink-muted mt-1">Each fit is computed from your inferred skills against role requirements.</p>
      </div>

      {top.length > 0 ? (
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {top.map((r) => <RoleFitCard key={r.role_id} role={r} size="lg" />)}
        </div>
      ) : (
        <p className="mt-6 text-[13.5px] text-ink-muted">No role predictions yet — sync your profile first.</p>
      )}

      {/* Skill Gap Deep Dive */}
      {top[0] && (
        <section className="mt-12">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">skill gap deep dive</div>
          <h2 className="text-[20px] font-semibold mt-0.5">{top[0].role_name}</h2>
          {gapSkills.length > 0 ? (
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {gapSkills.slice(0, 6).map((g, i) => (
                <Receipt
                  key={g.skill_id}
                  title={`gap · ${g.skill_name}`}
                  items={[
                    { label: "priority", value: i === 0 ? "P0" : i === 1 ? "P1" : "P2" },
                    { label: "priority score", value: g.priority_score.toFixed(2) },
                    { label: "role importance", value: g.importance.toFixed(2) },
                  ]}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-ink-muted">No skill-gap data available for this role yet.</p>
          )}
        </section>
      )}

      {/* Suggested projects to close gaps */}
      {projectIdeas && projectIdeas.length > 0 && (
        <section className="mt-12">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">suggested projects</div>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            {projectIdeas.slice(0, 4).map((idea) => (
              <div key={idea.title} className="border border-line rounded-md p-4 bg-surface">
                <div className="font-mono text-[13px] font-semibold">{idea.title}</div>
                <p className="text-[13px] text-ink-muted mt-1 leading-6">{idea.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {idea.skills_exercised.map((s) => (
                    <span key={s} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-line bg-secondary/60">{s}</span>
                  ))}
                </div>
                <div className="mt-2 font-mono text-[11px] text-ink-muted">{idea.estimated_hours}h · complexity {idea.complexity}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full role list */}
      {rest.length > 0 && (
        <section className="mt-12">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">all roles</div>
          <div className="mt-3 border border-line rounded-md bg-surface divide-y divide-line">
            {rest.map((r) => (
              <div key={r.role_id} className="p-4 grid grid-cols-[1.5fr_2fr_1fr] items-center gap-4">
                <div className="text-[14px] font-semibold">{r.role_name}</div>
                <ConfidenceBar value={r.confidence} size="md" />
                <div className="font-mono text-[12px] text-ink-muted text-right">{Math.round(r.confidence * 100)}% fit</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
