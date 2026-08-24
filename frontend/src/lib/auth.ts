import { reactive } from "vue";

import {
  getTopSession,
  loginTopAccount,
  logoutTopAccount,
  registerTopAccount,
  updateTopProfile,
  type AuthUser
} from "./api";

export const authState = reactive({
  status: "unknown" as "unknown" | "authenticated" | "anonymous",
  user: null as AuthUser | null
});

export const profileVisualState = reactive({
  avatarDataUrl: readStoredAvatar()
});

let sessionRequest: Promise<AuthUser | null> | null = null;

export async function restoreTopSession(): Promise<AuthUser | null> {
  if (authState.status === "authenticated") return authState.user;
  if (sessionRequest) return sessionRequest;

  sessionRequest = getTopSession()
    .then(({ user }) => {
      authState.user = user;
      authState.status = "authenticated";
      return user;
    })
    .catch(() => {
      authState.user = null;
      authState.status = "anonymous";
      return null;
    })
    .finally(() => { sessionRequest = null; });

  return sessionRequest;
}

export async function createTopAccount(input: { email: string; displayName: string; password: string }): Promise<AuthUser> {
  const { user } = await registerTopAccount(input);
  authState.user = user;
  authState.status = "authenticated";
  return user;
}

export async function signInToTop(input: { email: string; password: string }): Promise<AuthUser> {
  const { user } = await loginTopAccount(input);
  authState.user = user;
  authState.status = "authenticated";
  return user;
}

export async function refineTopProfile(input: { displayName?: string; biography?: string | null; location?: string | null }): Promise<AuthUser> {
  const { user } = await updateTopProfile(input);
  authState.user = user;
  authState.status = "authenticated";
  return user;
}

export async function leaveTop(): Promise<void> {
  try { await logoutTopAccount(); } finally { authState.user = null; authState.status = "anonymous"; }
}

export function markTopSessionAnonymous(): void {
  authState.user = null;
  authState.status = "anonymous";
}

export function saveTopAvatar(dataUrl: string | null): void {
  profileVisualState.avatarDataUrl = dataUrl;
  try {
    if (dataUrl) localStorage.setItem("top-profile-avatar", dataUrl);
    else localStorage.removeItem("top-profile-avatar");
  } catch {
    // The profile still updates for this visit if browser storage is unavailable.
  }
}

function readStoredAvatar(): string | null {
  try { return localStorage.getItem("top-profile-avatar"); } catch { return null; }
}
