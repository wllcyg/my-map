export class SimpleLRU<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max = 200) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh key (move to end of iteration order)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: K, val: V) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict oldest (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, val);
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instances to persist across HMR in development
const globalForCache = global as unknown as {
  placesTileCache: SimpleLRU<string, Buffer>;
  routesTileCache: SimpleLRU<string, Buffer>;
};

export const placesTileCache = globalForCache.placesTileCache || new SimpleLRU<string, Buffer>(500);
export const routesTileCache = globalForCache.routesTileCache || new SimpleLRU<string, Buffer>(500);

if (process.env.NODE_ENV !== "production") {
  globalForCache.placesTileCache = placesTileCache;
  globalForCache.routesTileCache = routesTileCache;
}
