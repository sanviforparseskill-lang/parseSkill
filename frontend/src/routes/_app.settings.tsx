import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useClearChatHistory, useLinkAccount, usePortfolio, useProfile,
  usePublishPortfolio, useResumeParse, useUnlinkAccount, useUpdateProfile,
  useUploadResume, useVerificationToken,
} from "@/lib/queries";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-surface rounded-md p-6">
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{title}</div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="font-mono text-[11px] text-ink-muted mb-1">{label}</div>
      {children}
    </label>
  );
}

const LINKABLE = ["leetcode", "codeforces", "kaggle"] as const;

function Settings() {
  const nav = useNavigate();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const linkAccount = useLinkAccount();
  const unlinkAccount = useUnlinkAccount();
  const uploadResume = useUploadResume();
  const clearChat = useClearChatHistory();
  const { data: portfolio } = usePortfolio();
  const publishPortfolio = usePublishPortfolio();
  const { data: verification } = useVerificationToken();
  const { data: resume } = useResumeParse();

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [handles, setHandles] = useState<Record<string, string>>({ leetcode: "", codeforces: "", kaggle: "" });
  const [showSteps, setShowSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setTagline(profile.tagline ?? "");
      setLocation(profile.location ?? "");
    }
  }, [profile]);

  const save = () => {
    updateProfile.mutate(
      { display_name: name, tagline, location },
      { onSuccess: () => toast.success("Profile saved"), onError: () => toast.error("Could not save profile") },
    );
  };

  const link = (platform: string) => {
    const handle = handles[platform];
    if (!handle) return;
    linkAccount.mutate(
      { platform, handle },
      {
        onSuccess: () => {
          toast.success(`${platform} linked`);
          setShowSteps((s) => ({ ...s, [platform]: false }));
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : `Could not link ${platform}`),
      },
    );
  };

  const unlink = (platform: string) => {
    unlinkAccount.mutate(platform, {
      onSuccess: () => toast.success(`${platform} disconnected`),
      onError: () => toast.error(`Could not disconnect ${platform}`),
    });
  };

  const onResumeChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadResume.mutate(file, {
      onSuccess: (result) => toast.success(`Resume parsed — ${result.skills_claimed.length} skills claimed`),
      onError: () => toast.error("Could not parse resume"),
    });
  };

  const signOut = async () => {
    await api.post("/auth/signout");
    nav({ to: "/auth/signin" });
  };

  const linkedHandle: Record<string, string | null> = {
    leetcode: profile?.leetcode_handle ?? null,
    codeforces: profile?.codeforces_handle ?? null,
    kaggle: profile?.kaggle_handle ?? null,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24 space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">settings</div>
        <h1 className="text-[28px] font-semibold mt-0.5">Account & data</h1>
      </div>

      <Section title="profile">
        <Field label="display name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] outline-none focus:border-signal" />
        </Field>
        <Field label="tagline">
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] outline-none focus:border-signal" />
        </Field>
        <Field label="location">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] outline-none focus:border-signal" />
        </Field>
        <button onClick={save} className="mt-2 h-9 px-3 rounded bg-signal text-signal-foreground font-mono text-[12px]">save</button>
      </Section>

      <Section title="linked accounts">
        <div className="divide-y divide-line">
          <div className="py-3 flex items-center justify-between font-mono text-[12.5px]">
            <div>
              <div>GitHub</div>
              <div className="text-[11px] text-ink-muted">
                @{profile?.github_handle} · last sync · {profile?.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : "never"}
              </div>
            </div>
            <span className="px-3 h-8 border rounded text-[11.5px] border-proof text-proof inline-flex items-center">connected</span>
          </div>
          {LINKABLE.map((platform) => {
            const connected = !!linkedHandle[platform];
            const needsVerification = platform === "leetcode" || platform === "codeforces";
            return (
              <div key={platform} className="py-3 font-mono text-[12.5px]">
                <div className="flex items-center justify-between gap-3">
                  <div className="capitalize">{platform}</div>
                  {connected ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink-muted">{linkedHandle[platform]}</span>
                      <button onClick={() => unlink(platform)} className="px-3 h-8 border rounded text-[11.5px] border-proof text-proof">disconnect</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        placeholder="handle"
                        value={handles[platform]}
                        onChange={(e) => setHandles((h) => ({ ...h, [platform]: e.target.value }))}
                        className="h-8 w-32 rounded border border-line bg-background px-2 font-mono text-[11.5px] outline-none focus:border-signal"
                      />
                      {needsVerification && (
                        <button
                          onClick={() => setShowSteps((s) => ({ ...s, [platform]: !s[platform] }))}
                          className="px-2 h-8 font-mono text-[11px] text-ink-muted hover:text-ink underline underline-offset-2"
                        >
                          {showSteps[platform] ? "hide steps" : "how to verify"}
                        </button>
                      )}
                      <button onClick={() => link(platform)} disabled={linkAccount.isPending} className="px-3 h-8 border rounded text-[11.5px] border-line hover:border-signal disabled:opacity-50">
                        {linkAccount.isPending ? "connecting…" : "connect"}
                      </button>
                    </div>
                  )}
                </div>
                {!connected && needsVerification && showSteps[platform] && (
                  <div className="mt-2 p-3 rounded border border-line bg-background text-[11.5px] text-ink-muted space-y-2">
                    <p>{verification?.instructions[platform] ?? "Loading…"}</p>
                    {verification?.token && (
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-secondary text-ink">{verification.token}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(verification.token);
                            toast.success("Token copied");
                          }}
                          className="px-2 h-6 border border-line rounded text-[10.5px] hover:border-signal"
                        >
                          copy
                        </button>
                      </div>
                    )}
                    <p>Once it's on your public profile, come back and click connect.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="data & privacy">
        <div className="space-y-3">
          <label className="flex items-center gap-2 font-mono text-[12px]">
            <input
              type="checkbox"
              checked={portfolio?.is_public ?? false}
              onChange={(e) => publishPortfolio.mutate(e.target.checked)}
              className="accent-signal"
            /> portfolio publicly visible at /@{portfolio?.slug ?? profile?.github_handle}
          </label>
        </div>
      </Section>

      <Section title="resume">
        <p className="text-[13px] text-ink-muted mb-2">
          Parsed and kept so you can see what was extracted. Claimed skills that also show up as GitHub-evidenced
          are marked confirmed below — nothing here overrides or adds to your inferred skills on its own.
        </p>
        <input type="file" accept="application/pdf" onChange={onResumeChosen} disabled={uploadResume.isPending} className="font-mono text-[12px]" />
        {uploadResume.isPending && <p className="mt-2 font-mono text-[11.5px] text-ink-muted">parsing…</p>}

        {resume && (resume.skills_claimed.length > 0 || resume.education.length > 0 || resume.work_experience.length > 0) && (
          <div className="mt-4 space-y-3">
            {resume.parsed_at && (
              <div className="font-mono text-[11px] text-ink-muted">last parsed {new Date(resume.parsed_at).toLocaleString()}</div>
            )}
            {resume.skills_claimed.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5">skills claimed</div>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills_claimed.map((s) => {
                    const confirmed = resume.corroborated_skills.includes(s);
                    return (
                      <span
                        key={s}
                        className={`font-mono text-[11px] px-2 py-1 rounded border ${confirmed ? "border-proof text-proof" : "border-line text-ink-muted"}`}
                        title={confirmed ? "Also evidenced in your GitHub code" : "Not yet evidenced in your GitHub code"}
                      >
                        {confirmed ? "✓ " : ""}{s}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {resume.work_experience.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5">work experience</div>
                <ul className="space-y-1 font-mono text-[12px] text-ink-muted">
                  {resume.work_experience.map((w, i) => (
                    <li key={i}>{w.title ?? "?"} · {w.company ?? "?"} {w.start_date ? `(${w.start_date} – ${w.end_date ?? "present"})` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
            {resume.education.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-1.5">education</div>
                <ul className="space-y-1 font-mono text-[12px] text-ink-muted">
                  {resume.education.map((e, i) => (
                    <li key={i}>{e.degree ?? "?"} {e.field ? `in ${e.field}` : ""} · {e.institution ?? "?"} {e.year ? `(${e.year})` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="ai assistant">
        <button
          onClick={() => clearChat.mutate(undefined, { onSuccess: () => toast.success("Chat history cleared") })}
          className="h-9 px-3 rounded border border-line font-mono text-[12px] hover:border-signal"
        >clear chat history</button>
      </Section>

      <Section title="session">
        <button onClick={signOut} className="h-9 px-3 rounded border border-line font-mono text-[12px] hover:border-signal">sign out</button>
      </Section>
    </div>
  );
}
