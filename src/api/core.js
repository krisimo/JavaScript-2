export const USE_MOCK = false; 

export { API_BASE, request as api } from "./http.js";
export { registerReal, loginReal, fetchProfileReal, updateProfileReal } from "./auth.js";
export {
  listPostsReal,
  getPostReal,
  createPostReal,
  updatePostReal,
  deletePostReal,
  reactPostReal,
  createCommentReal,
} from "./posts.js";

console.log("[core.js] loaded", { USE_MOCK });

// ---------- auth store ----------
const KEY = "auth";
export const getAuth   = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
export const setAuth   = (u) => localStorage.setItem(KEY, JSON.stringify(u));
export const clearAuth = () => localStorage.removeItem(KEY);

export async function loadMockUser() {
  const res = await fetch("../data/mock-user.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`mock-user.json ${res.status}`);
  return res.json();
}
export async function loadMockPosts() {
  try {
    const res = await fetch("../data/mock-posts.json", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// ---------- utils ----------
export const PLACEHOLDER_200 = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <rect width='100%' height='100%' fill='%23222'/>
  <circle cx='100' cy='100' r='72' fill='%23333'/>
</svg>`.replace(/\n/g, "");

export const PLACEHOLDER_44  = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'>
  <rect width='100%' height='100%' fill='%23222'/>
  <circle cx='22' cy='22' r='16' fill='%23333'/>
</svg>`.replace(/\n/g, "");

export function safeAvatar(url, size = 200) {
  const ok = typeof url === "string" && url.trim() !== "";
  return ok ? url : (size >= 200 ? PLACEHOLDER_200 : PLACEHOLDER_44);
}
export function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
export const same = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

export function normalizePosts(raw = []) {
  return raw.map(p => ({
    id: p.id,
    title: p.title ?? "",
    body: p.body ?? "",
    created: p.created ?? p.createdAt ?? p.created_at,
    authorName: p.author?.name ?? "unknown",
    authorAvatar: p.author?.avatar?.url ?? "",
    reactions: p._count?.reactions ?? p.reactions?.length ?? 0,
    comments:  p._count?.comments  ?? p.comments?.length  ?? 0,
    media: p.media?.url ?? null,
  }));
}
