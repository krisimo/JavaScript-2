import { listPostsReal } from "./posts.js";

const PAGE_SIZE = 12;

let currentPage = 1;
let reachedEnd = false;
let loading = false;
let postsCache = [];

export function resetPagination() {
  currentPage = 1;
  reachedEnd = false;
  loading = false;
  postsCache = [];
}


export async function loadPosts({ refresh = false } = {}) {
  if (loading) return postsCache;
  if (refresh) resetPagination();

  if (!postsCache.length || refresh) {
    loading = true;
    try {
      currentPage = 1;
      const pageItems = await listPostsReal({
        page: currentPage,
        limit: PAGE_SIZE,
        sort: "created",
        sortOrder: "desc",
      });
      const arr = Array.isArray(pageItems) ? pageItems : (pageItems?.data || []);
      postsCache = arr;
      reachedEnd = arr.length < PAGE_SIZE;
      return postsCache;
    } finally {
      loading = false;
    }
  }

  return postsCache;
}

export async function loadMorePosts() {
  if (loading || reachedEnd) return [];
  loading = true;
  try {
    const nextPage = currentPage + 1;
    const nextItems = await listPostsReal({
      page: nextPage,
      limit: PAGE_SIZE,
      sort: "created",
      sortOrder: "desc",
    });
    const arr = Array.isArray(nextItems) ? nextItems : (nextItems?.data || []);
    if (arr.length) {
      postsCache = postsCache.concat(arr);
      currentPage = nextPage;
    }
    if (arr.length < PAGE_SIZE) reachedEnd = true;
    return arr;
  } finally {
    loading = false;
  }
}

export function getPostsCache() {
  return postsCache;
}

export function hasMorePosts() {
  return !reachedEnd;
}
