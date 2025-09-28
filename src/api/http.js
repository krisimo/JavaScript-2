export const API_BASE = "https://v2.api.noroff.dev";
export const API_KEY  = "3cd18e14-497f-411c-a28e-4aa7b6f9b285";

/**
 * Fetch wrapper that adds JSON headers, API key and (if present) JWT.
 * @param {string} path - Relative path (e.g. "/social/posts") or absolute URL.
 * @param {{method?: "GET"|"POST"|"PUT"|"DELETE", headers?: Object, body?: any}} [opts]
 * @returns {Promise<any>} Parsed `data` (if present) or whole JSON.
 * @throws {Error} With server message when status is not 2xx.
 */
export async function request(path, { method = "GET", headers = {}, body } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const final = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": API_KEY,
    ...headers,
  };

  // Attach Bearer to all non-/auth requests if we have one
  try {
    const { getAuth } = await import("./core.js");
    const token = getAuth()?.accessToken;
    if (token && !path.startsWith("/auth/")) {
      final.Authorization = `Bearer ${token}`;
    }
  } catch {}

  const rawBody = body != null ? JSON.stringify(body) : undefined;

  console.log("[HTTP]", method, url, { headers: final, rawBody });

  const res  = await fetch(url, { method, headers: final, body: rawBody });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.errors?.[0]?.message || json?.message || res.statusText;
    console.error("[HTTP] ×", method, url, res.status, msg, json);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return json?.data ?? json;
}

export { request as api };
