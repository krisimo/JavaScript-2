import {
  loginReal,
  fetchProfileReal,
  createPostReal,
  deletePostReal,
  getAuth, setAuth, clearAuth,
  timeAgo, same, safeAvatar, PLACEHOLDER_200, PLACEHOLDER_44, normalizePosts,
} from "../api/core.js";

import { attachInteractionHandlers } from "../api/interactions.js";
import {
  loadPosts, loadMorePosts, getPostsCache, hasMorePosts, resetPagination
} from "../api/pagination.js";

const d = (...a) => console.log("%c[TS]", "color:#ff6600;font-weight:bold", ...a);

function goto(hash) { location.hash = hash; }
function currentPath() { return (location.hash || "#/login").replace(/^#/, ""); }

window.addEventListener("hashchange", () => { try { route(); } catch (e) { console.error(e); } });
document.addEventListener("DOMContentLoaded", () => { if (!location.hash) goto(getAuth() ? "#/feed" : "#/login"); route(); });

function renderLogin() {
  const el = document.getElementById("content");
  el.innerHTML = `
    <section class="landing-hero" aria-labelledby="ts-title">
      <div class="pitch">
        <h1 id="ts-title">ThrottleSocial</h1>
        <p>Share rides, routes and stories with riders like you.</p>
      </div>

      <aside class="login-panel" aria-label="Sign in">
        <h2>Sign In</h2>
        <form id="login-form" novalidate>
          <label><span>Email</span><input type="email" name="email" required autocomplete="username"/></label>
          <label><span>Password</span><input type="password" name="password" required autocomplete="current-password"/></label>
          <button class="login-primary action-btn" type="submit">Login</button>
          <p id="login-error" class="muted" style="display:none;color:#ffb3b3;margin-top:8px;"></p>
        </form>
      </aside>
    </section>
  `;

  const form = document.getElementById("login-form");
  const err  = document.getElementById("login-error");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.style.display = "none";
    const fd = new FormData(form);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");

    try {
      const auth = await loginReal(email, password);
      const name = auth.name ?? auth.data?.name ?? email.split("@")[0];

      setAuth({
        name,
        email: auth.email ?? email,
        accessToken: auth.accessToken ?? auth.data?.accessToken ?? "",
        avatar: "",
        bio: "",
        _count: { posts: 0, followers: 0, following: 0 },
      });

      let profile = {};
      try { profile = await fetchProfileReal(name); } catch {}

      setAuth({
        name,
        email: auth.email ?? email,
        accessToken: auth.accessToken ?? auth.data?.accessToken ?? "",
        avatar: profile.avatar || "",
        bio: profile.bio || "",
        _count: profile._count ?? { posts: 0, followers: 0, following: 0 },
      });

      resetPagination();
      goto("#/feed");
    } catch (e2) {
      console.error(e2);
      err.textContent = e2?.message || "Login failed";
      err.style.display = "block";
    }
  });
}

function ensureShell() {
  const user = getAuth();
  if (!user) { goto("#/login"); return false; }

  if (!document.querySelector(".app")) {
    const el = document.getElementById("content");
    el.innerHTML = `
      <section class="app">
        <header class="app-header">
          <img class="app-avatar" alt="Avatar"/>
          <div>
            <h1>Hi, ${user.name}</h1>
            <div class="muted">${user.bio || user.email || ""}</div>
          </div>
        </header>

        <nav class="app-tabs" role="tablist">
          <button class="tab" data-tab="feed">Feed</button>
          <button class="tab" data-tab="create">Create</button>
          <button class="tab" data-tab="profile">Profile</button>
          <button class="tab" data-tab="search">Search</button>
          <button class="tab danger" data-tab="logout">Logout</button>
        </nav>

        <div id="view"></div>
      </section>
    `;

    const img = document.querySelector(".app-avatar");
    img.src = safeAvatar(user.avatar, 200);
    img.onerror = () => { img.src = PLACEHOLDER_200; };

    document.querySelectorAll(".app-tabs .tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const t = btn.dataset.tab;
        if (t === "logout") { clearAuth(); resetPagination(); goto("#/login"); return; }
        goto("#/" + t);
      });
    });
  }
  return true;
}

function setActiveTab(name) {
  document.querySelectorAll(".app-tabs .tab")
    .forEach(b => b.classList.toggle("active", b.dataset.tab === name));
}

async function renderFeed() {
  if (!ensureShell()) return;
  setActiveTab("feed");
  const view = document.getElementById("view");

  try {
    await loadPosts();
    const items = normalizePosts(getPostsCache());

    view.innerHTML = items.length
      ? `<div class="feed">
           ${items.map(p => `
             <article class="post-card" data-id="${p.id}">
               <header class="post-header">
                 <img class="post-avatar" src="${safeAvatar(p.authorAvatar,44)}" alt="${p.authorName}"
                      onerror="this.src='${PLACEHOLDER_44}'"/>
                 <div>
                   <div class="post-author">${p.authorName}</div>
                   <div class="post-meta muted">
                     ${timeAgo(p.created)} •
                     <button class="link-btn js-react" data-id="${p.id}">${p.reactions} reactions</button> •
                     <button class="link-btn js-comments" data-id="${p.id}">${p.comments} comments</button>
                   </div>
                 </div>
               </header>
               <div class="post-body">
                 ${p.title ? `<h3>${p.title}</h3>` : ""}
                 <p>${p.body}</p>
                 ${p.media ? `<div class="post-media"><img src="${p.media}" alt=""></div>` : ""}
               </div>
             </article>
           `).join("")}
         </div>`
      : `<p class="muted">No posts yet. Create one!</p>`;

    view.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this post?")) return;
        try {
          await deletePostReal(id);
          resetPagination();
          await loadPosts({ refresh: true });
          renderFeed();
        } catch (e) { alert(e.message || "Couldn’t delete post"); }
      });
    });

    attachInteractionHandlers(view, getPostsCache(), {
      rerenderFeed: async () => {
        resetPagination();
        await loadPosts({ refresh: true });
        renderFeed();
      }
    });

    // Load more
    if (hasMorePosts()) {
      const wrap = document.createElement("div");
      wrap.style.textAlign = "center";
      wrap.style.margin = "18px 0";
      wrap.innerHTML = `<button id="load-more" class="action-btn">Load more</button>`;
      view.appendChild(wrap);

      const btn = document.getElementById("load-more");
      btn.addEventListener("click", async () => {
        btn.disabled = true; btn.textContent = "Loading…";
        try {
          await loadMorePosts();
          renderFeed();
        } catch (e) {
          alert(e.message || "Couldn’t load more posts");
          btn.disabled = false; btn.textContent = "Load more";
        }
      });
    }
  } catch (e) {
    console.error(e);
    view.innerHTML = `<p class="muted">Couldn’t load posts: ${e.message}</p>`;
  }
}

function renderCreate() {
  if (!ensureShell()) return;
  setActiveTab("create");
  const view = document.getElementById("view");

  view.innerHTML = `
    <form id="create-form" class="create-form">
      <label><span>Title</span><input name="title"/></label>
      <label><span>Body</span><textarea name="body" rows="4" required></textarea></label>
      <label><span>Image URL (optional)</span><input name="media" placeholder="https://..."/></label>
      <button class="action-btn" type="submit">Publish</button>
    </form>
  `;

  document.getElementById("create-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") || "").toString().trim();
    const body  = (fd.get("body")  || "").toString().trim();
    const media = (fd.get("media") || "").toString().trim() || null;

    try {
      await createPostReal({ title, body, media });
      resetPagination();
      goto("#/feed");
    } catch (err) {
      alert(err.message || "Couldn’t create post");
    }
  });
}

function renderProfile() {
  if (!ensureShell()) return;
  setActiveTab("profile");
  const view = document.getElementById("view");
  const u = getAuth();

  view.innerHTML = `
    <div class="profile-card">
      <img class="profile-avatar" src="${safeAvatar(u.avatar,200)}" alt="${u.name}"
           onerror="this.src='${PLACEHOLDER_200}'"/>
      <h2>${u.name}</h2>
      <p class="muted">${u.bio || u.email || ""}</p>
      <div class="stats">
        <div><strong>${u._count?.posts ?? 0}</strong><span>Posts</span></div>
        <div><strong>${u._count?.followers ?? 0}</strong><span>Followers</span></div>
        <div><strong>${u._count?.following ?? 0}</strong><span>Following</span></div>
      </div>
    </div>
  `;
}

function renderSearch() {
  if (!ensureShell()) return;
  setActiveTab("search");
  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="search">
      <input id="q" placeholder="Search posts…"/>
      <div id="results" class="feed"></div>
    </div>
  `;

  const q = document.getElementById("q");
  const results = document.getElementById("results");

  const run = async () => {
    await loadPosts();
    const items = normalizePosts(getPostsCache());
    const term = q.value.toLowerCase().trim();
    const hits = items.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.body.toLowerCase().includes(term)  ||
      p.authorName.toLowerCase().includes(term)
    );

    results.innerHTML = hits.length
      ? hits.map(p => `
          <article class="post-card">
            <header class="post-header">
              <img class="post-avatar" src="${safeAvatar(p.authorAvatar,44)}" alt="${p.authorName}"
                   onerror="this.src='${PLACEHOLDER_44}'"/>
              <div>
                <div class="post-author">${p.authorName}</div>
                <div class="post-meta muted">${timeAgo(p.created)}</div>
              </div>
            </header>
            <div class="post-body">
              ${p.title ? `<h3>${p.title}</h3>` : ""}
              <p>${p.body}</p>
            </div>
          </article>
        `).join("")
      : `<p class="muted">No matches.</p>`;
  };

  q.addEventListener("input", run);
  run();
}

function route() {
  const path = currentPath();
  d("route:", path);
  if (path === "/login") return renderLogin();
  if (!getAuth())       return goto("#/login");

  switch (path) {
    case "/feed":    return renderFeed();
    case "/create":  return renderCreate();
    case "/profile": return renderProfile();
    case "/search":  return renderSearch();
    default:         return goto("#/feed");
  }
}
