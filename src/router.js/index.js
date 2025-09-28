const routes = new Map();

export function route(path, handler) { routes.set(path, handler); }
export function startRouter() {
  const resolve = () => {
    const hash = location.hash || "#/feed";
    for (const [pattern, handler] of routes) {
      const m = match(pattern, hash);
      if (m) return handler(m.params);
    }
    // 404 fallback
    console.warn("No route matched:", hash);
  };
  window.addEventListener("hashchange", resolve);
  resolve();
}

function match(pattern, hash) {
  const [p, q] = pattern.split("?");
  const pat = p.split("/").filter(Boolean);
  const cur = hash.replace(/^#/, "").split("?")[0].split("/").filter(Boolean);
  if (pat.length !== cur.length) return null;
  const params = {};
  for (let i = 0; i < pat.length; i++) {
    if (pat[i].startsWith(":")) params[pat[i].slice(1)] = decodeURIComponent(cur[i]);
    else if (pat[i] !== cur[i]) return null;
  }
  return { params };
}
