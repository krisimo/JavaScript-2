import { api } from "./http.js";

const BASE = "/social/posts";

/** GET /social/posts*/
export async function listPostsReal({ page = 1, limit = 50, sort = "created", sortOrder = "desc" } = {}) {
  const qs = new URLSearchParams({
    _author: "true",
    _comments: "true",
    _reactions: "true",
    page: String(page),
    limit: String(limit),
    sort,
    sortOrder,
  });
  const url = `${BASE}?${qs.toString()}`;
  console.log("[POSTS] listPostsReal →", url);
  return api(url, { method: "GET" });
}

/** GET /social/posts/{id}*/
export async function getPostReal(id) {
  const qs = "_author=true&_comments=true&_reactions=true";
  const url = `${BASE}/${encodeURIComponent(id)}?${qs}`;
  console.log("[POSTS] getPostReal →", url);
  return api(url, { method: "GET" });
}

/** POST /social/posts */
export async function createPostReal({ title, body, media }) {
  const payload = { title, body };
  if (media) payload.media = { url: media, alt: "" };
  console.log("[POSTS] createPostReal", payload);
  return api(BASE, { method: "POST", body: payload });
}

/**
 * Update a post.
 * @param {string|number} id
 * @param {{title?: string, body?: string, media?: string|null}} patch
 * @returns {Promise<any>}
 */
export async function updatePostReal(id, { title, body, media }) {
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (body  !== undefined) payload.body  = body;
  if (media) payload.media = { url: media, alt: "" };
  console.log("[POSTS] updatePostReal", id, payload);
  return api(`${BASE}/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
}

/** DELETE /social/posts/{id} */
export async function deletePostReal(id) {
  console.log("[POSTS] deletePostReal", id);
  return api(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** PUT /social/posts/{id}/react/{symbol} */
export async function reactPostReal(id, symbol) {
  console.log("[POSTS] reactPostReal", id, symbol);
  return api(`${BASE}/${encodeURIComponent(id)}/react/${encodeURIComponent(symbol)}`, { method: "PUT" });
}

/** POST /social/posts/{id}/comment */
export async function createCommentReal(id, text) {
  console.log("[POSTS] createCommentReal", id, text);
  return api(`${BASE}/${encodeURIComponent(id)}/comment`, { method: "POST", body: { body: text } });
}
