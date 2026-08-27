import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { SyncLog, type SyncLine } from "@/components/brand/SyncLog";
import { useCurrentUser, useLinkAccount, useProfile, useTriggerSync, useUpdateProfile, useUploadResume, useVerificationToken } from "@/lib/queries";
import { sseUrl } from "@/lib/api";
import type { SyncProgressEvent } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const steps = ["Confirm identity", "Link platforms", "Optional resume"] as const;

function Onboarding() {
  const nav = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const linkAccount = useLinkAccount();
  const uploadResume = useUploadResume();
  const triggerSync = useTriggerSync();
  const { data: verification } = useVerificationToken();

  const [step, setStep] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lines, setLines] = useState<SyncLine[]>([]);
  const [tagline, setTagline] = useState("");
  const [name, setName] = useState("");
  const [handles, setHandles] = useState<Record<string, string>>({ leetcode: "", codeforces: "", kaggle: "" });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setTagline(profile.tagline ?? "");
    }
  }, [profile]);
  useEffect(() => () => eventSourceRef.current?.close(), []);

  const startInitialSync = async () => {
    if (name || tagline) {
      await updateProfile.mutateAsync({ display_name: name || undefined, tagline: tagline || undefined });
    }
    setSyncing(true);
    setLines([{ text: "$ parseSkill sync --initial", tone: "info" }]);
    try {
      const { job_id } = await triggerSync.mutateAsync();
      const es = new EventSource(sseUrl(`/sync/stream/${job_id}`), { withCredentials: true });
      eventSourceRef.current = es;
      es.addEventListener("progress", (evt) => {
        const payload = JSON.parse((evt as MessageEvent).data) as SyncProgressEvent;
        setLines((prev) => [...prev, { text: `→ ${payload.stage}`, tone: payload.stage === "error" ? "warn" : undefined }]);
        if (payload.stage === "done") {
          toast.success("Sync complete");
          es.close();
          nav({ to: "/dashboard" });
        } else if (payload.stage === "error") {
          toast.error("Sync failed — you can retry from the dashboard");
          es.close();
          nav({ to: "/dashboard" });
        }
      });
      es.onerror = () => {
        es.close();
        nav({ to: "/dashboard" });
      };
    } catch {
      toast.error("Could not start sync");
      nav({ to: "/dashboard" });
    }
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else startInitialSync();
  };
  const skip = () => (step < 2 ? setStep(step + 1) : startInitialSync());

  const verify = (platform: string) => {
    const handle = handles[platform];
    if (!handle) return;
    linkAccount.mutate(
      { platform, handle },
      {
        onSuccess: () => toast.success(`${platform} linked`),
        onError: (err) => toast.error(err instanceof Error ? err.message : `Could not link ${platform}`),
      },
    );
  };

  const onResumeChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadResume.mutate(file, {
      onSuccess: (result) => toast.success(`Resume parsed — ${result.skills_claimed.length} skills claimed`),
      onError: () => toast.error("Could not parse resume"),
    });
  };

  if (syncing) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-4">
        <div className="w-full max-w-2xl">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted mb-3">
            initial sync · this only happens once
          </div>
          <SyncLog className="h-80" lines={lines} done />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-line px-6 flex items-center bg-surface">
        <Wordmark className="text-[15px]" />
      </header>
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Step {step + 1} of {steps.length} — {steps[step]}
        </div>
        <div className="mt-2 flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-signal" : "bg-secondary"}`} />
          ))}
        </div>

        <div className="mt-8 border border-line bg-surface rounded-md p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Confirm identity</h2>
              <p className="text-sm text-ink-muted">Pulled from GitHub. Edit anything before continuing.</p>
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-14 h-14 rounded-full border border-line bg-secondary" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-full border border-line bg-secondary" />
                )}
                <div className="text-xs font-mono text-ink-muted">avatar from GitHub</div>
              </div>
              <label className="block">
                <div className="font-mono text-[11px] uppercase text-ink-muted">display name</div>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] focus:border-signal outline-none" />
              </label>
              <label className="block">
                <div className="font-mono text-[11px] uppercase text-ink-muted">tagline</div>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-1 w-full h-10 rounded border border-line bg-background px-3 font-mono text-[13px] focus:border-signal outline-none" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Link additional platforms</h2>
              <p className="text-sm text-ink-muted">Each one adds evidence nodes to your skill graph. All optional.</p>
              {verification && (
                <div className="p-3 rounded border border-line bg-background font-mono text-[11.5px] text-ink-muted space-y-1.5">
                  <p>LeetCode and Codeforces require proving you own the handle: paste this token into your profile bio first, then click verify.</p>
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
                  <p>LeetCode: paste it into "About Me". Codeforces: paste it into "Organization" (Settings).</p>
                </div>
              )}
              {(["leetcode", "codeforces", "kaggle"] as const).map((platform) => (
                <div key={platform} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
                  <span className="font-mono text-[12.5px] capitalize">{platform}</span>
                  <input
                    placeholder="your_handle"
                    value={handles[platform]}
                    onChange={(e) => setHandles((h) => ({ ...h, [platform]: e.target.value }))}
                    className="h-9 rounded border border-line bg-background px-3 font-mono text-[12.5px] focus:border-signal outline-none"
                  />
                  <button onClick={() => verify(platform)} className="h-9 px-3 rounded border border-line font-mono text-[11.5px] hover:border-signal">verify</button>
                </div>
              ))}
              <p className="font-mono text-[11px] text-ink-muted mt-2">
                Verification uses a one-time token pasted into your bio. It is not stored after verification.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Optional resume upload</h2>
              <p className="text-sm text-ink-muted">
                We use it only to cross-check your GitHub skills. Nothing on your profile comes from the resume unless
                it is also present in your code.
              </p>
              <div className="border border-dashed border-line rounded-md p-8 text-center">
                <div className="font-mono text-[12px] text-ink-muted mb-2">Drop a PDF here, or</div>
                <input type="file" accept="application/pdf" onChange={onResumeChosen} className="font-mono text-[12px]" />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            <button onClick={skip} className="font-mono text-[12px] text-ink-muted hover:text-ink">skip this step</button>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="h-10 px-4 rounded border border-line font-mono text-[12.5px] hover:border-signal">back</button>
              )}
              <button onClick={next} className="h-10 px-4 rounded bg-signal text-signal-foreground font-mono text-[12.5px] hover:opacity-90">
                {step === 2 ? "review & sync" : "continue →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
