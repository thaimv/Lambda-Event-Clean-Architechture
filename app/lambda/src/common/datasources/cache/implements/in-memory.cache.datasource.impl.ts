import type { ICacheEntry, ICacheDatasource } from '@common/datasources/cache/cache.datasource';
import { injectable } from 'inversify';

/**
 * In-memory implementation of the ICacheDatasource interface.
 * This implementation stores cache entries in a Map and supports TTL (time-to-live).
 */
@injectable()
export class InMemoryCacheDatasource implements ICacheDatasource {
  private cache: Map<string, ICacheEntry<unknown>> = new Map();

  /** @inheritdoc */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /** @inheritdoc */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expiresAt });
  }

  /** @inheritdoc */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /** @inheritdoc */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}
