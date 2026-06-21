import Cookies from "js-cookie";
import api from "./api";
import { User, AuthTokens } from "@/types";

const COOKIE_OPTS = { expires: 1, secure: true, sameSite: "strict" as const };
const REFRESH_OPTS = { expires: 7, secure: true, sameSite: "strict" as const };

export function setTokens(tokens: AuthTokens) {
  Cookies.set("access_token", tokens.access, COOKIE_OPTS);
  Cookies.set("refresh_token", tokens.refresh, REFRESH_OPTS);
}

export function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("access_token") || !!Cookies.get("refresh_token");
}

export async function login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
  const { data } = await api.post("/auth/login/", { email, password });
  setTokens(data);
  return { user: data.user, tokens: { access: data.access, refresh: data.refresh } };
}

export async function register(
  email: string,
  password: string,
  password2: string,
  full_name: string
): Promise<{ user: User; tokens: AuthTokens }> {
  const { data } = await api.post("/auth/register/", { email, password, password2, full_name });
  setTokens(data.tokens);
  return { user: data.user, tokens: data.tokens };
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await api.post("/auth/logout/", { refresh: refreshToken });
  } finally {
    clearTokens();
  }
}

export async function getProfile(): Promise<User> {
  const { data } = await api.get("/auth/profile/");
  return data;
}
