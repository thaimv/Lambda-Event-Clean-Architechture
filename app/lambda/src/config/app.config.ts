import { APP_CONST } from '@common/constants/app.const';
import type { TDatabaseConfig } from '@common/types/config.type';
import { getEnv } from '@common/utils/env-util';
import { injectable } from 'inversify';

@injectable()
export class AppConfig {
  get nodeEnv() {
    return getEnv('NODE_ENV', APP_CONST.ENVIRONMENTS.LOCAL);
  }

  get isProduction() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.PROD;
  }

  get isDevelopment() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.DEV;
  }

  get isLocal() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.LOCAL;
  }

  get isTest() {
    return this.nodeEnv === APP_CONST.ENVIRONMENTS.TEST;
  }

  get dbConfig(): TDatabaseConfig {
    const dbUrl = getEnv('DATABASE_URL', '');
    const dbUrlReplica = getEnv('DATABASE_URL_REPLICA', dbUrl);
    const maxRetries = Number(getEnv('DATABASE_MAX_RETRIES', '3'));
    const backOffMs = Number(getEnv('RETRY_PRISMA_CLIENT_TIMEOUT_MS', '1000'));
    const connectionLimit = Number(getEnv('DATABASE_CONNECTION_LIMIT', '3'));

    const proxyEndpoint = getEnv('RDS_PROXY_ENDPOINT');
    const proxyEndpointReplica = getEnv('RDS_PROXY_ENDPOINT_REPLICA', proxyEndpoint);

    return {
      dbUrl,
      dbUrlReplica,
      proxyEndpoint,
      proxyEndpointReplica,
      maxRetries,
      backOffMs,
      connectionLimit,
    };
  }

  get awsConfig() {
    return {
      region: process.env.AWS_REGION ?? getEnv('REGION'),
    };
  }

  get cognitoUserPoolConfig() {
    const userPoolId = getEnv('COGNITO_USER_POOL_ID');
    const clientId = getEnv('COGNITO_USER_POOL_CLIENT_ID');
    const region = getEnv('COGNITO_USER_POOL_REGION', this.awsConfig.region);
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    const loginProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    return {
      userPoolId,
      clientId,
      region,
      issuer,
      jwksUrl,
      loginProvider,
    };
  }

  get cognitoIdentityConfig() {
    const { loginProvider } = this.cognitoUserPoolConfig;

    return {
      identityPoolId: getEnv('COGNITO_IDENTITY_POOL_ID'),
      userPoolLoginProvider: loginProvider,
      tokenDurationSeconds: Number(getEnv('TOKEN_DURATION_SECONDS')),
    };
  }

  get secretManagerKeys() {
    return {
      RDS_SECRET_ARN: getEnv('RDS_SECRET_ARN'),
      GCS_SECRET_NAME: getEnv('GCS_SECRET_NAME', ''),
    };
  }

  get dynamoDBConfig() {
    return {
      endpoint: getEnv('DYNAMODB_ENDPOINT'),
    };
  }

  get lambdaConfig() {
    return {
      retryCount: getEnv('INSERT_RETRY_COUNT'),
      graphqlApiArn: getEnv('LAMBDA_GRAPHQL_API_ARN'),
    };
  }

  get s3BucketConfig() {
    return {
      get s3CommonBucket() {
        return getEnv('S3_COMMON_BUCKET');
      },
    };
  }

  get cloudFront() {
    return {
      get url() {
        return getEnv('CLOUD_FRONT_URL');
      },
      get commonDir() {
        return getEnv('CLOUD_FRONT_COMMON_DIR');
      },
    };
  }

  get elastiCacheConfig() {
    const portEnv = getEnv('ELASTICACHE_PORT');
    const port = Number(portEnv);
    if (isNaN(port)) {
      throw new Error('ELASTICACHE_PORT environment variable is invalid');
    }

    const slidingExpiration =
      getEnv('ELASTICACHE_SLIDING_EXPIRATION', 'true').toLowerCase() === 'true';

    const ttlEnv = getEnv('ELASTICACHE_TTL', '86400');
    const ttl = Number(ttlEnv);
    if (isNaN(ttl)) {
      throw new Error('ELASTICACHE_TTL environment variable is invalid');
    }

    const useTLS = getEnv('ELASTICACHE_USE_TLS', 'true').toLowerCase() === 'true';
    const clusterMode = getEnv('ELASTICACHE_CLUSTER_MODE', 'false').toLowerCase() === 'true';

    const requestTimeoutMsEnv = getEnv('ELASTICACHE_REQUEST_TIMEOUT_MS', '15000');
    const requestTimeoutMs = Number(requestTimeoutMsEnv);
    if (isNaN(requestTimeoutMs)) {
      throw new Error('ELASTICACHE_REQUEST_TIMEOUT_MS environment variable is invalid');
    }

    const connectionTimeoutMsEnv = getEnv('ELASTICACHE_CONNECTION_TIMEOUT_MS', '15000');
    const connectionTimeoutMs = Number(connectionTimeoutMsEnv);
    if (isNaN(connectionTimeoutMs)) {
      throw new Error('ELASTICACHE_CONNECTION_TIMEOUT_MS environment variable is invalid');
    }

    return {
      host: getEnv('ELASTICACHE_HOST'),
      port,
      slidingExpiration,
      ttl,
      useTLS,
      clusterMode,
      requestTimeoutMs,
      connectionTimeoutMs,
    };
  }
}
