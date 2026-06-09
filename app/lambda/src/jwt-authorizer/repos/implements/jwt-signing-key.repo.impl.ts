import { DI } from '@common/constants/di.const';
import { HttpMethod } from '@common/constants/rest-api.const';
import type { IApiGatewayDatasource } from '@common/datasources/api-gateway/api-gateway.datasource';
import type { ICacheDatasource } from '@common/datasources/cache/cache.datasource';
import { logger } from '@common/logger';
import type { AppConfig } from '@lambda/config/app.config';
import type { JwtSigningKey } from '@lambda/jwt-authorizer/models/jwt-signing-key.model';
import type { IJwtSigningKeyRepo } from '@lambda/jwt-authorizer/repos/jwt-signing-key.repo';
import { inject, injectable } from 'inversify';

@injectable()
export class JwtSigningKeyRepo implements IJwtSigningKeyRepo {
  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
    @inject(DI.API_GATEWAY_DATASOURCE)
    private readonly apiGateway: IApiGatewayDatasource,
    @inject(DI.CACHE_DATASOURCE)
    private readonly cache: ICacheDatasource,
  ) {}

  async getSigningKey(kid: string): Promise<JwtSigningKey | undefined> {
    const cacheKey = `jwk-kid:${kid}`;
    const cachedJwk = await this.readCache(cacheKey);
    if (cachedJwk) {
      logger.debug(`JWK found in cache for kid: ${kid}`);
      return cachedJwk;
    }

    logger.debug(`JWK not found in cache for kid: ${kid}. Loading from JWKS endpoint.`);
    const keys = await this.loadJWKS();

    let result: JwtSigningKey | undefined;

    for (const key of keys) {
      if (key.kid === kid) {
        result = key;
      }
      await this.writeCache(`jwk-kid:${key.kid}`, key);
    }

    return result;
  }

  private async loadJWKS(): Promise<JwtSigningKey[]> {
    const parsedData = await this.apiGateway.invoke<{ keys: JwtSigningKey[] }>(
      this.appConfig.cognitoUserPoolConfig.jwksUrl,
      HttpMethod.GET,
    );

    return parsedData.keys;
  }

  private async readCache(cacheKey: string): Promise<JwtSigningKey | null> {
    try {
      return await this.cache.get<JwtSigningKey>(cacheKey);
    } catch (error) {
      logger.warn('Valkey cache unavailable, skipping cache read', {
        cacheKey,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async writeCache(cacheKey: string, value: JwtSigningKey): Promise<void> {
    try {
      await this.cache.set(cacheKey, value);
    } catch (error) {
      logger.warn('Valkey cache unavailable, skipping cache write', {
        cacheKey,
        error: (error as Error).message,
      });
    }
  }
}
