const KEY = "auth";

export function getAuth() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; }
  catch { return null; }
}

export function setAuth(auth) {
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

export function authHeader() {
  const auth = getAuth();
  return auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {};
}
