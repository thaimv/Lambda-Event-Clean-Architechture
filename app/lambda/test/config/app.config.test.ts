/* eslint-disable max-lines-per-function */
import 'reflect-metadata';
import { AppConfig } from '@lambda/config/app.config';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('AppConfig', () => {
  let config: AppConfig;

  beforeEach(() => {
    config = new AppConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('nodeEnv', () => {
    test('should return test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(config.nodeEnv).toBe('test');
    });

    test('should return default if NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(config.nodeEnv).toBe('local');
    });
  });

  describe('isProduction', () => {
    test('should return true if NODE_ENV is production', () => {
      vi.stubEnv('NODE_ENV', 'prd');
      expect(config.isProduction).toBe(true);
    });
  });

  describe('isDevelopment', () => {
    test('should return true if NODE_ENV is development', () => {
      vi.stubEnv('NODE_ENV', 'dev');
      expect(config.isDevelopment).toBe(true);
    });
  });

  describe('isTest', () => {
    test('should return true if NODE_ENV is test', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(config.isTest).toBe(true);
    });
  });

  describe('isLocal', () => {
    test('should return true if NODE_ENV is local', () => {
      vi.stubEnv('NODE_ENV', 'local');
      expect(config.isLocal).toBe(true);
    });
  });

  describe('dbConfig', () => {
    test('should return dbConfig', () => {
      vi.stubEnv('DATABASE_URL', 'db_url');
      vi.stubEnv('DATABASE_URL_REPLICA', 'db_url_replica');
      vi.stubEnv('RDS_PROXY_ENDPOINT', 'proxy_endpoint');
      vi.stubEnv('RDS_PROXY_ENDPOINT_REPLICA', 'proxy_endpoint_replica');
      vi.stubEnv('DATABASE_MAX_RETRIES', '1');
      vi.stubEnv('RETRY_PRISMA_CLIENT_TIMEOUT_MS', '1000');

      expect(config.dbConfig).toEqual({
        dbUrl: 'db_url',
        dbUrlReplica: 'db_url_replica',
        proxyEndpoint: 'proxy_endpoint',
        proxyEndpointReplica: 'proxy_endpoint_replica',
        maxRetries: 1,
        connectionLimit: 3,
        backOffMs: 1000,
      });
    });
  });

  describe('awsConfig', () => {
    test('should return awsConfig', () => {
      vi.stubEnv('AWS_REGION', 'aws_region');
      expect(config.awsConfig).toEqual({
        region: 'aws_region',
      });
    });
  });

  describe('secretManagerKeys', () => {
    test('should return secretManagerKeys', () => {
      vi.stubEnv('RDS_SECRET_ARN', 'rds_secret_arn');
      vi.stubEnv('GCS_SECRET_NAME', 'gcs_secret_name');
      expect(config.secretManagerKeys).toEqual({
        RDS_SECRET_ARN: 'rds_secret_arn',
        GCS_SECRET_NAME: 'gcs_secret_name',
      });
    });

    test('should default GCS_SECRET_NAME to empty string', () => {
      vi.stubEnv('RDS_SECRET_ARN', 'rds_secret_arn');
      delete process.env.GCS_SECRET_NAME;
      expect(config.secretManagerKeys).toEqual({
        RDS_SECRET_ARN: 'rds_secret_arn',
        GCS_SECRET_NAME: '',
      });
    });
  });

  describe('lambdaConfig', () => {
    test('should return lambdaConfig', () => {
      vi.stubEnv('INSERT_RETRY_COUNT', '3');
      vi.stubEnv('LAMBDA_GRAPHQL_API_ARN', 'arn:aws:lambda:us-east-1:123:function:graphql');
      expect(config.lambdaConfig).toEqual({
        retryCount: '3',
        graphqlApiArn: 'arn:aws:lambda:us-east-1:123:function:graphql',
      });
    });
  });

  describe('cognitoUserPoolConfig', () => {
    test('should return cognitoUserPoolConfig with issuer and jwksUrl', () => {
      vi.stubEnv('AWS_REGION', 'us-east-1');
      vi.stubEnv('COGNITO_USER_POOL_ID', 'us-east-1_test');
      vi.stubEnv('COGNITO_USER_POOL_CLIENT_ID', 'test-client-id');
      vi.stubEnv('COGNITO_USER_POOL_REGION', 'us-east-1');

      expect(config.cognitoUserPoolConfig).toEqual({
        userPoolId: 'us-east-1_test',
        clientId: 'test-client-id',
        region: 'us-east-1',
        issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
        jwksUrl: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test/.well-known/jwks.json',
        loginProvider: 'cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
      });
    });

    test('should throw error if COGNITO_USER_POOL_ID is not set', () => {
      vi.stubEnv('COGNITO_USER_POOL_CLIENT_ID', 'test-client-id');
      delete process.env.COGNITO_USER_POOL_ID;

      expect(() => config.cognitoUserPoolConfig).toThrow(
        'COGNITO_USER_POOL_ID environment variable does not set',
      );
    });

    test('should throw error if COGNITO_USER_POOL_CLIENT_ID is not set', () => {
      vi.stubEnv('COGNITO_USER_POOL_ID', 'us-east-1_test');
      delete process.env.COGNITO_USER_POOL_CLIENT_ID;

      expect(() => config.cognitoUserPoolConfig).toThrow(
        'COGNITO_USER_POOL_CLIENT_ID environment variable does not set',
      );
    });
  });

  describe('elastiCacheConfig', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test('should return elastiCacheConfig', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_SLIDING_EXPIRATION', 'true');
      vi.stubEnv('ELASTICACHE_TTL', '120');

      expect(config.elastiCacheConfig).toEqual({
        host: 'elasticache_host',
        port: 6379,
        slidingExpiration: true,
        ttl: 120,
        useTLS: true,
        clusterMode: false,
        requestTimeoutMs: 15000,
        connectionTimeoutMs: 15000,
      });
    });

    test('should return default elastiCacheConfig if env vars are not set', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');

      expect(config.elastiCacheConfig).toEqual({
        host: 'elasticache_host',
        port: 6379,
        slidingExpiration: true,
        ttl: 86400,
        useTLS: true,
        clusterMode: false,
        requestTimeoutMs: 15000,
        connectionTimeoutMs: 15000,
      });
    });

    test('should throw error if ELASTICACHE_PORT is not a number', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', 'invalid_port');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_PORT environment variable is invalid',
      );
    });

    test('should set slidingExpiration to false if ELASTICACHE_SLIDING_EXPIRATION is false', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_SLIDING_EXPIRATION', 'false');

      expect(config.elastiCacheConfig.slidingExpiration).toBe(false);
    });

    test('should throw error if ELASTICACHE_TTL is not a number', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_TTL', 'invalid_ttl');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_TTL environment variable is invalid',
      );
    });

    test('should parse custom ElastiCache timeout env vars', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_REQUEST_TIMEOUT_MS', '30000');
      vi.stubEnv('ELASTICACHE_CONNECTION_TIMEOUT_MS', '20000');

      expect(config.elastiCacheConfig.requestTimeoutMs).toBe(30000);
      expect(config.elastiCacheConfig.connectionTimeoutMs).toBe(20000);
    });

    test('should throw error if ELASTICACHE_REQUEST_TIMEOUT_MS is invalid', () => {
      vi.stubEnv('ELASTICACHE_HOST', 'elasticache_host');
      vi.stubEnv('ELASTICACHE_PORT', '6379');
      vi.stubEnv('ELASTICACHE_REQUEST_TIMEOUT_MS', 'invalid');

      expect(() => config.elastiCacheConfig).toThrow(
        'ELASTICACHE_REQUEST_TIMEOUT_MS environment variable is invalid',
      );
    });
  });
});
