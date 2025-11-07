class Cache {
  constructor() {
    this.storageKey = 'apiCache';
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.cache = stored ? JSON.parse(stored) : {};
    } catch (e) {
      this.cache = {};
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
    } catch (e) {
      // Ignore if localStorage is full or unavailable
    }
  }

  get(key) {
    const item = this.cache[key];
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiry) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }

    return item.data;
  }

  set(key, data, ttl = 5 * 60 * 1000) { // Default TTL: 5 minutes
    const expiry = Date.now() + ttl;
    this.cache[key] = { data, expiry };
    this.saveToStorage();
  }

  clear() {
    this.cache = {};
    this.saveToStorage();
  }
}

const apiCache = new Cache();

export default apiCache;
