import { api } from "../api/http.js";

export async function registerReal({ name, email, password, avatar }) {
  const payload = { name, email, password };
  if (avatar) payload.avatar = { url: avatar, alt: "" };

  console.log("[AUTH] registerReal()", payload);
  const out = await api("/auth/register", { method: "POST", body: payload });
  console.log("[AUTH] registerReal ✓", out);
  return out;
}

export async function loginReal(email, password) {
  console.log("[AUTH] loginReal()", { email });
  const out = await api("/auth/login", { method: "POST", body: { email, password } });
  console.log("[AUTH] loginReal ✓", out);
  return out;
}

export async function fetchProfileReal(name) {
  const path = `/social/profiles/${encodeURIComponent(name)}?_followers=true&_following=true&_posts=true`;
  console.log("[AUTH] fetchProfileReal()", { name, path });
  return api(path, { method: "GET" });
}

export async function updateProfileReal(name, { bio, avatar, banner } = {}) {
  const body = {};
  if (bio !== undefined) body.bio = bio;
  if (avatar) body.avatar = { url: avatar, alt: "" };
  if (banner) body.banner = { url: banner, alt: "" };
  console.log("[AUTH] updateProfileReal()", { name, body });
  return api(`/social/profiles/${encodeURIComponent(name)}`, { method: "PUT", body });
}
