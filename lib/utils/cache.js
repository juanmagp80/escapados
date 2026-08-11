export function inMemoryCache(ttlMs = 1000 * 60 * 60) {
  const store = new Map();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return null;
      if (Date.now() > hit.expires) {
        store.delete(key);
        return null;
      }
      return hit.value;
    },
    set(key, value) {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    },
  };
}

export async function withFallback(fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    return fallback;
  }
}