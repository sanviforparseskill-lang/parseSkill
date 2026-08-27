import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useResumeAudit, useUploadResume } from "@/lib/queries";
import { Receipt } from "@/components/brand/Receipt";
import { ConfidenceBar } from "@/components/brand/ConfidenceBar";
import { FileCheck2, GraduationCap, Briefcase, Upload, CircleAlert } from "lucide-react";

export const Route = createFileRoute("/_app/resume-audit")({ component: ResumeAuditPage });

function ResumeAuditPage() {
  const { data: audit, isLoading } = useResumeAudit();
  const uploadResume = useUploadResume();

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadResume.mutate(file, {
      onSuccess: (result) =>
        toast.success(`Resume parsed — ${result.skills_claimed.length} skills claimed`),
      onError: () => toast.error("Could not parse resume"),
    });
    e.target.value = "";
  };

  const hasResume = !!audit && audit.skills.length > 0;
  const implemented = audit?.skills.filter((s) => s.implemented) ?? [];
  const unimplemented = audit?.skills.filter((s) => !s.implemented) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            resume audit
          </div>
          <h1 className="text-[28px] font-semibold mt-0.5">
            Does your resume match your receipts?
          </h1>
          <p className="text-[14px] text-ink-muted mt-1">
            Every skill you claim, checked against the code evidence already collected from your
            repos — education and work history included for reference.
          </p>
        </div>
        <label className="h-9 px-3 rounded border border-line font-mono text-[12px] hover:border-signal inline-flex items-center gap-2 cursor-pointer shrink-0">
          <Upload className="h-3.5 w-3.5" />
          {uploadResume.isPending ? "parsing…" : hasResume ? "re-upload resume" : "upload resume"}
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileChosen}
            disabled={uploadResume.isPending}
            className="hidden"
          />
        </label>
      </div>

      {!isLoading && !hasResume && (
        <div className="mt-10 border border-dashed border-line rounded-md p-10 text-center">
          <FileCheck2 className="h-6 w-6 mx-auto text-ink-muted" />
          <p className="mt-3 text-[13.5px] text-ink-muted">
            No resume on file yet. Upload a PDF and we'll check every skill you claim against what
            your synced repos actually prove.
          </p>
        </div>
      )}

      {hasResume && audit && (
        <>
          {/* Credibility score */}
          <div className="mt-6 border border-line rounded-md bg-surface p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  credibility score
                </div>
                <div className="text-[32px] font-semibold mt-0.5 tabular-nums">
                  {Math.round((audit.credibility_score ?? 0) * 100)}%
                </div>
                <p className="text-[12.5px] text-ink-muted mt-1">
                  {implemented.length} of {audit.skills.length} claimed skills are backed by code
                  you actually wrote.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <ConfidenceBar value={audit.credibility_score ?? 0} size="md" />
              </div>
            </div>
          </div>

          {/* Implemented skills */}
          {implemented.length > 0 && (
            <section className="mt-10">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                proven in code
              </div>
              <h2 className="text-[18px] font-semibold mt-0.5">Backed by your repos</h2>
              <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {implemented.map((s) => (
                  <Receipt
                    key={s.name}
                    title={s.name}
                    stamp="VERIFIED"
                    items={[
                      { label: "confidence", value: `${Math.round((s.confidence ?? 0) * 100)}%` },
                      ...s.evidence_repos
                        .slice(0, 4)
                        .map((e) => ({ label: "repo", value: e.repo_full_name })),
                    ]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Unproven claims */}
          {unimplemented.length > 0 && (
            <section className="mt-10">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                no proof seen
              </div>
              <h2 className="text-[18px] font-semibold mt-0.5">
                Claimed, but not in your synced code
              </h2>
              <p className="text-[13px] text-ink-muted mt-1">
                Not necessarily wrong — could be a skill from a private repo, a non-GitHub project,
                or just not reflected in what's synced yet.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {unimplemented.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 font-mono text-[12px] px-2.5 py-1.5 rounded border border-line text-ink-muted"
                  >
                    <CircleAlert className="h-3.5 w-3.5" />
                    {s.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {audit.education.length > 0 && (
            <section className="mt-10">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" /> education
              </div>
              <div className="mt-3 border border-line rounded-md bg-surface divide-y divide-line">
                {audit.education.map((e, i) => (
                  <div key={i} className="p-4 font-mono text-[12.5px]">
                    <div className="text-ink">
                      {e.degree ?? "—"} {e.field ? `in ${e.field}` : ""}
                    </div>
                    <div className="text-ink-muted mt-0.5">
                      {e.institution ?? "—"} {e.year ? `· ${e.year}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Work experience */}
          {audit.work_experience.length > 0 && (
            <section className="mt-10">
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> work experience
              </div>
              <div className="mt-3 border border-line rounded-md bg-surface divide-y divide-line">
                {audit.work_experience.map((w, i) => (
                  <div key={i} className="p-4 font-mono text-[12.5px]">
                    <div className="text-ink">
                      {w.title ?? "—"} · {w.company ?? "—"}
                    </div>
                    <div className="text-ink-muted mt-0.5">
                      {w.start_date ? `${w.start_date} – ${w.end_date ?? "present"}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
