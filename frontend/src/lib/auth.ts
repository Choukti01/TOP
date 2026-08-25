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
let sessionGeneration = 0;

export async function restoreTopSession(): Promise<AuthUser | null> {
  if (authState.status === "authenticated") return authState.user;
  if (sessionRequest) return sessionRequest;

  const generation = sessionGeneration;
  const request = getTopSession()
    .then(({ user }) => {
      if (generation !== sessionGeneration) return null;
      authState.user = user;
      authState.status = "authenticated";
      saveTopAvatar(user.avatarDataUrl);
      return user;
    })
    .catch(() => {
      if (generation !== sessionGeneration) return null;
      authState.user = null;
      authState.status = "anonymous";
      return null;
    })
    .finally(() => { if (sessionRequest === request) sessionRequest = null; });

  sessionRequest = request;
  return request;
}

export async function createTopAccount(input: { email: string; displayName: string; password: string }): Promise<AuthUser> {
  const { user } = await registerTopAccount(input);
  beginAuthenticatedSession();
  authState.user = user;
  authState.status = "authenticated";
  saveTopAvatar(user.avatarDataUrl);
  return user;
}

export async function signInToTop(input: { email: string; password: string }): Promise<AuthUser> {
  const { user } = await loginTopAccount(input);
  beginAuthenticatedSession();
  authState.user = user;
  authState.status = "authenticated";
  saveTopAvatar(user.avatarDataUrl);
  return user;
}

export async function refineTopProfile(input: { displayName?: string; biography?: string | null; location?: string | null; fieldName?: string | null; avatarDataUrl?: string | null }): Promise<AuthUser> {
  const { user } = await updateTopProfile(input);
  authState.user = user;
  authState.status = "authenticated";
  saveTopAvatar(user.avatarDataUrl);
  return user;
}

export async function leaveTop(): Promise<void> {
  sessionGeneration += 1;
  sessionRequest = null;
  try { await logoutTopAccount(); } finally { clearLocalAccountState(); }
}

export function markTopSessionAnonymous(): void {
  sessionGeneration += 1;
  sessionRequest = null;
  clearLocalAccountState();
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

function beginAuthenticatedSession(): void {
  sessionGeneration += 1;
  sessionRequest = null;
}

function clearLocalAccountState(): void {
  authState.user = null;
  authState.status = "anonymous";
  profileVisualState.avatarDataUrl = null;
  try {
    for (const key of ["top-profile-avatar", "top-workspace", "top-world-name", "top-field-intention"]) localStorage.removeItem(key);
  } catch {
    // A private browser can block storage access; the in-memory session is still cleared.
  }
}
