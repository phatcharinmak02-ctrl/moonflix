const API_BASE_URL = (import.meta.env.VITE_API_URL || "https://react-api.dev2life.workers.dev/api/v1").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "series-finder-access-token";
const REFRESH_TOKEN_KEY = "series-finder-refresh-token";

export function getAccessToken() {
  try { return localStorage.getItem(ACCESS_TOKEN_KEY) || ""; } catch { return ""; }
}

export function clearAuthTokens() {
  try { localStorage.removeItem(ACCESS_TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); } catch { /* storage unavailable */ }
}

export function saveAuthResult(data) {
  try {
    if (data?.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data?.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  } catch { /* storage unavailable */ }
}

let refreshPromise;

async function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      let refreshToken = "";
      try { refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || ""; } catch { /* storage unavailable */ }
      if (!refreshToken) return false;
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        clearAuthTokens();
        const error = result?.error || { code: "REFRESH_TOKEN_INVALID", message: "กรุณาเข้าสู่ระบบอีกครั้ง" };
        window.dispatchEvent(new CustomEvent("series-finder-auth-invalid", { detail: error }));
        return false;
      }
      saveAuthResult(result.data);
      return true;
    })().finally(() => { refreshPromise = undefined; });
  }
  return refreshPromise;
}

export async function authRequest(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path.startsWith("http") ? path : `${API_BASE_URL}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  const code = result?.error?.code;
  if (retry && response.status === 401 && code === "TOKEN_EXPIRED") {
    if (await refreshTokens()) return authRequest(path, options, false);
    const error = new Error(result?.error?.message || "Please sign in again.");
    error.response = { status: response.status, data: result };
    throw error;
  }
  if (["TOKEN_INVALID", "TOKEN_MISSING", "REFRESH_TOKEN_INVALID", "ACCOUNT_BANNED"].includes(code)) {
    clearAuthTokens();
    window.dispatchEvent(new CustomEvent("series-finder-auth-invalid", { detail: { code, message: result.error?.message } }));
  }
  if (!response.ok || result.success === false) {
    const error = new Error(result?.error?.message || "Request failed.");
    error.response = { status: response.status, data: result };
    throw error;
  }
  return result.data;
}

export async function localApiFetch(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  if (retry && response.status === 401) {
    const result = await response.clone().json().catch(() => ({}));
    if (result?.error?.code === "TOKEN_EXPIRED") {
      try { await authRequest("/auth/me"); return localApiFetch(path, options, false); } catch { /* auth event clears invalid credentials */ }
    }
    if (["TOKEN_INVALID", "TOKEN_MISSING", "REFRESH_TOKEN_INVALID", "ACCOUNT_BANNED"].includes(result?.error?.code)) {
      clearAuthTokens();
      window.dispatchEvent(new CustomEvent("series-finder-auth-invalid", { detail: result.error }));
    }
  }
  return response;
}

export { API_BASE_URL };
