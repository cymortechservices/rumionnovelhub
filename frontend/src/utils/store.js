// localStorage / sessionStorage that never throw (private mode, blocked storage, quota).
const make = (get) => ({
  get(key, fallback = null) {
    try {
      const v = get().getItem(key);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      get().setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      get().removeItem(key);
    } catch {
      /* ignore */
    }
  },
});

export const local = make(() => window.localStorage);
export const session = make(() => window.sessionStorage);
