console.log("[interactions.js] loaded");

import { USE_MOCK, getAuth } from "./core.js";
import {
  getPostReal,
  createCommentReal,
  reactPostReal,
} from "./posts.js";

/* Fallback placeholders */
const PLACEHOLDER_44  = "https://via.placeholder.com/44";
const PLACEHOLDER_200 = "https://via.placeholder.com/200";
const safeAvatar = (url, big = false) =>
  (typeof url === "string" && url.trim() !== "") ? url : (big ? PLACEHOLDER_200 : PLACEHOLDER_44);

function ensureHost() {
  let host = document.getElementById("modal-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "modal-host";
    document.body.appendChild(host);
  }
  return host;
}
function closeModal() {
  const host = document.getElementById("modal-host");
  if (host) host.innerHTML = "";
  document.removeEventListener("keydown", onEsc);
}
function onEsc(e) { if (e.key === "Escape") closeModal(); }

/* ---------- COMMENTS ---------- */
async function loadComments(postId, postsCache) {
  if (USE_MOCK) {
    const p = postsCache.find(p => String(p.id) === String(postId));
    return p?.comments || [];
  }
  const post = await getPostReal(postId);
  return post.comments || post._comments || [];
}

async function addComment(postId, text, postsCache) {
  if (USE_MOCK) {
    const me = getAuth();
    const p = postsCache.find(p => String(p.id) === String(postId));
    if (!p) return;
    if (!p.comments) p.comments = [];
    p.comments.push({
      id: Date.now(),
      body: text,
      created: new Date().toISOString(),
      owner: { name: me?.name || "You", avatar: me?.avatar || "" },
    });
    p._count = p._count || {};
    p._count.comments = (p._count.comments || 0) + 1;
    return;
  }
  await createCommentReal(postId, text);
}

export async function openCommentsModal(postId, postsCache) {
  console.log("[interactions] openCommentsModal", { postId });
  const host = ensureHost();
  host.innerHTML = `
    <div class="modal-backdrop" data-close>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Comments">
        <header class="modal-header">
          <strong>Comments</strong>
          <button id="modal-close" class="link-btn">Close ✕</button>
        </header>
        <div id="comments-list" class="comments-list">
          <p class="muted">Loading…</p>
        </div>
        <form id="comment-form" class="comment-form">
          <textarea name="body" placeholder="Write a comment…" required></textarea>
          <button type="submit" class="action-btn">Post</button>
        </form>
      </div>
    </div>
  `;

  document.addEventListener("keydown", onEsc);
  host.querySelector("[data-close]")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  host.querySelector("#modal-close")?.addEventListener("click", closeModal);

  const listEl = host.querySelector("#comments-list");

  async function renderList() {
    const items = await loadComments(postId, postsCache);
    if (!items.length) {
      listEl.innerHTML = `<p class="muted">No comments yet. Be the first!</p>`;
      return;
    }
    listEl.innerHTML = items.map(c => `
      <div class="comment-row">
        <img class="comment-avatar" src="${safeAvatar(c.owner?.avatar || c.author?.avatar)}"
             alt="${c.owner?.name || c.author?.name || "User"}"
             onerror="this.src='${PLACEHOLDER_44}'" />
        <div class="comment-bubble">
          <div class="comment-meta">
            <strong>${c.owner?.name || c.author?.name || "User"}</strong>
          </div>
          <div class="comment-text">${(c.body || "").replace(/</g,"&lt;")}</div>
        </div>
      </div>
    `).join("");
  }

  await renderList();

  const form = host.querySelector("#comment-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = (new FormData(form).get("body") || "").toString().trim();
    if (!body) return;
    try {
      await addComment(postId, body, postsCache);
      await renderList();
      form.reset();
    } catch (err) {
      console.error(err);
      alert(err.message || "Couldn’t add comment");
    }
  });
}

async function react(postId, symbol, postsCache) {
  if (USE_MOCK) {
    const p = postsCache.find(p => String(p.id) === String(postId));
    if (!p) return;
    p._count = p._count || {};
    const current = Number(p._count.reactions || 0);
    p._count.reactions = symbol === "👎" ? Math.max(0, current - 1) : current + 1;
    return { reactions: p._count.reactions };
  }
  await reactPostReal(postId, symbol);
  return null;
}

export function openReactionsModal(postId, postsCache, onDone) {
  const host = ensureHost();
  host.innerHTML = `
    <div class="modal-backdrop" data-close>
      <div class="modal small" role="dialog" aria-modal="true" aria-label="React">
        <header class="modal-header">
          <strong>React</strong>
          <button id="modal-close" class="link-btn">Close ✕</button>
        </header>
        <div class="react-grid">
          <button class="react-btn" data-symbol="👍" title="Like">👍</button>
          <button class="react-btn" data-symbol="👎" title="Dislike">👎</button>
        </div>
      </div>
    </div>
  `;

  document.addEventListener("keydown", onEsc);
  host.querySelector("[data-close]")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  host.querySelector("#modal-close")?.addEventListener("click", closeModal);

  host.querySelectorAll(".react-btn").forEach(b => {
    b.addEventListener("click", async () => {
      const symbol = b.dataset.symbol;
      try {
        await react(postId, symbol, postsCache);
        closeModal();
        onDone?.(); 
      } catch (e) {
        console.error(e);
        alert(e.message || "Couldn’t react");
      }
    });
  });
}

export function attachInteractionHandlers(container, postsCache, { rerenderFeed }) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-comments");
    if (btn) {
      e.preventDefault();
      openCommentsModal(btn.dataset.id, postsCache);
    }
  });

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".js-react");
    if (btn) {
      e.preventDefault();
      openReactionsModal(btn.dataset.id, postsCache, rerenderFeed);
    }
  });
}
