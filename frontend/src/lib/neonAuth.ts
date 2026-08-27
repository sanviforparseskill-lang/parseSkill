import { createInternalNeonAuth } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";
import { api } from "@/lib/api";

const url = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;

/** True once VITE_NEON_AUTH_URL is set — see frontend/.env. */
export const isNeonAuthConfigured = Boolean(url);

const internal = url ? createInternalNeonAuth(url, { adapter: BetterAuthReactAdapter() }) : null;

/**
 * Neon Auth (Better Auth) client — second, independent sign-in path
 * alongside the primary GitHub OAuth flow. See auth.signin.tsx and
 * auth.neon-callback.tsx. Exposes signIn.email/social, signUp.email,
 * signOut, useSession, getSession.
 */
export const neonAuth = internal?.adapter ?? null;

/**
 * Exchanges the current Neon Auth session for our own `ps_access` session
 * cookie via POST /auth/neon/session, so the rest of the app doesn't need
 * to know Neon Auth exists.
 */
export async function completeNeonAuthSignIn(): Promise<{ onboarded: boolean }> {
  if (!internal) throw new Error("Neon Auth is not configured");
  const accessToken = await internal.getJWTToken();
  if (!accessToken) throw new Error("No Neon Auth session");
  return api.post<{ onboarded: boolean }>("/auth/neon/session", { access_token: accessToken });
}
