import { DI } from '@common/constants/di.const';
import type { ICacheDatasource } from '@common/datasources/cache/cache.datasource';
import { logger } from '@common/logger';
import type { AppConfig } from '@lambda/config/app.config';
import { GlideClient, GlideClusterClient, TimeUnit } from '@valkey/valkey-glide';
import { inject, injectable } from 'inversify';

export const minifyJSON = (json: string) => {
  return json.replace(/\s+/g, '');
};

type ValkeyGlideClient = GlideClient | GlideClusterClient;

let valkeyClient: ValkeyGlideClient | undefined;

@injectable()
export class ElastiCacheCacheDatasource implements ICacheDatasource {
  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  private async getClient(): Promise<ValkeyGlideClient> {
    if (!valkeyClient) {
      logger.debug('Creating new Valkey client instance');
      const { host, port, useTLS, clusterMode, requestTimeoutMs, connectionTimeoutMs } =
        this.appConfig.elastiCacheConfig;

      if (!host || !port) {
        throw new Error('ElastiCache HOST or PORT is not set');
      }

      const clientConfig = {
        addresses: [{ host, port }],
        useTLS,
        requestTimeout: requestTimeoutMs,
        advancedConfiguration: {
          connectionTimeout: connectionTimeoutMs,
        },
      };

      valkeyClient = clusterMode
        ? await GlideClusterClient.createClient({
            ...clientConfig,
            readFrom: 'preferReplica',
          })
        : await GlideClient.createClient(clientConfig);
    } else {
      logger.debug('Using cached Valkey client instance');
    }

    return valkeyClient;
  }

  async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    const { slidingExpiration, ttl } = this.appConfig.elastiCacheConfig;

    const result =
      slidingExpiration === true
        ? await client.getex(key, {
            expiry: { type: TimeUnit.Seconds, duration: ttl },
          })
        : await client.get(key);

    if (!result) {
      return null;
    }

    return JSON.parse(result?.toString()) as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const client = await this.getClient();
    const count = ttl !== undefined ? ttl : this.appConfig.elastiCacheConfig.ttl;
    await client.set(key, minifyJSON(JSON.stringify(value)), {
      expiry: { type: TimeUnit.Seconds, count },
    });
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del([key]);
  }

  async clear(): Promise<void> {
    const client = await this.getClient();
    await client.flushall();
  }
}
