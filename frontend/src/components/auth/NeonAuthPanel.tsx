import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { completeNeonAuthSignIn, neonAuth } from "@/lib/neonAuth";

/**
 * Second, independent sign-in path (Neon Auth) shown next to the primary
 * GitHub OAuth button — see auth.signin.tsx. Email/password sign-in
 * resolves inline; Google redirects to Neon Auth and back to
 * /auth/neon-callback, which finishes the session exchange.
 */
export function NeonAuthPanel() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  if (!neonAuth) return null;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!neonAuth) return;
    setError(null);
    setLoading("email");
    try {
      const { error: authError } =
        mode === "signin"
          ? await neonAuth.signIn.email({ email, password })
          : await neonAuth.signUp.email({ email, password, name: email.split("@")[0] });
      if (authError) {
        setError(authError.message ?? "Something went wrong");
        return;
      }
      const { onboarded } = await completeNeonAuthSignIn();
      navigate({ to: onboarded ? "/dashboard" : "/onboarding" });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    if (!neonAuth) return;
    setError(null);
    setLoading("google");
    try {
      await neonAuth.signIn.social({
        provider: "google",
        callbackURL: "/auth/neon-callback",
      });
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading !== null}
        className="w-full h-11 rounded-md border border-line bg-background font-medium hover:bg-surface inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-ink-muted">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="text-[12.5px] text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading !== null}
          className="w-full h-11 rounded-md border border-line bg-background font-medium hover:bg-surface inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="w-full text-center text-[12.5px] text-ink-muted hover:text-ink"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.38l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.62l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
