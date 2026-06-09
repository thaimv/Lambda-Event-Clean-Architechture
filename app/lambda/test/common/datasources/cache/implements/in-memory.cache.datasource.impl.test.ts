import 'reflect-metadata';
import { InMemoryCacheDatasource } from '@common/datasources/cache/implements/in-memory.cache.datasource.impl';
import { describe, test, expect, vi } from 'vitest';

describe.concurrent('InMemoryCacheDatasource', () => {
  test('should return null for missing key', async () => {
    const cache = new InMemoryCacheDatasource();
    const result = await cache.get('missing');
    expect(result).toBeNull();
  });

  test('should set and get a value', async () => {
    const cache = new InMemoryCacheDatasource();
    await cache.set('foo', 'bar');
    const result = await cache.get('foo');
    expect(result).toBe('bar');
  });

  test('should delete a value', async () => {
    const cache = new InMemoryCacheDatasource();
    await cache.set('foo', 'bar');
    await cache.delete('foo');
    const result = await cache.get('foo');
    expect(result).toBeNull();
  });

  test('should clear all values', async () => {
    const cache = new InMemoryCacheDatasource();
    await cache.set('foo', 'bar');
    await cache.set('baz', 'qux');
    await cache.clear();
    expect(await cache.get('foo')).toBeNull();
    expect(await cache.get('baz')).toBeNull();
  });

  test('should return null when ttl has expired', async () => {
    vi.useFakeTimers();
    const cache = new InMemoryCacheDatasource();

    await cache.set('foo', 'bar', 1);
    vi.advanceTimersByTime(1001);

    expect(await cache.get('foo')).toBeNull();
    vi.useRealTimers();
  });
});
