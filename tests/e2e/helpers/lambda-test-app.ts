import { SENSITIVE_FIELDS } from '@common/constants/app.const';
import {
  awsConfig,
  cloudwatchConfig,
  cognitoConfig,
  graphqlConfig,
  restApiConfig,
  testUserConfig,
} from '@e2e/config';
import { LogCollector, type ILogCollector } from '@e2e/helpers/cloudwatch-logs';
import { CognitoAuth, parseCognitoSubFromIdToken } from '@e2e/helpers/cognito-auth';
import { DbClient } from '@e2e/helpers/db';
import { GraphQL } from '@e2e/helpers/graphql';
import { Invoker } from '@e2e/helpers/invoker';
import { Requester } from '@e2e/helpers/requester';
import { RestApi } from '@e2e/helpers/rest-api';
import {
  type ISensitiveLeakDetector,
  SensitiveLeakDetector,
} from '@e2e/helpers/sensitive-leak-detector';

export type BootstrapOptions = {
  logGroupArns?: string[];
  /**
   * Which REST API base URL to use for `app.requester.sendRest()`.
   * Defaults to 'publicApi'. Use 'authApi' for auth-api endpoints.
   */
  restApi?: keyof typeof restApiConfig;
};

/**
 * Thin orchestrator for E2E test suite lifecycle in LambdaEvents.
 *
 * By default `bootstrap()` logs in via Cognito and produces an authenticated
 * `requester`. Use `app.withoutAuth()` to get an unauthenticated requester for
 * testing that unauthorized requests are correctly rejected.
 *
 * Usage:
 *   const app = getLambdaTestApp();
 *   beforeAll(async () => await app.bootstrap({ logGroupArns: [...] }), e2eHookTimeouts.beforeAll);
 *   afterAll(async () => await app.terminate(), e2eHookTimeouts.afterAll);
 *
 *   app.invoker.invoke(lambdaConfig.deleteUser, event)  // direct Lambda invoke
 *   app.requester.sendRest('POST', '/path', body)       // via API Gateway
 *   app.withoutAuth().sendRest(...)                     // no credentials
 *   app.db.client.user.findUnique(...)                  // DB assertions
 *
 * For invoker-only event suites, prefer `getEventTestApp()` from `event-test-app.ts`.
 */
export class LambdaTestApp {
  readonly collector: ILogCollector;
  readonly detector: ISensitiveLeakDetector;
  readonly invoker: Invoker;
  readonly db: DbClient;
  requester!: Requester;

  private _idToken?: string;
  private _restApiKey: keyof typeof restApiConfig = 'publicApi';

  constructor() {
    this.detector = new SensitiveLeakDetector([...SENSITIVE_FIELDS.hash, ...SENSITIVE_FIELDS.mask]);
    this.collector = new LogCollector(awsConfig, cloudwatchConfig);
    this.invoker = new Invoker(awsConfig);
    this.db = new DbClient();
  }

  async bootstrap({
    logGroupArns = [],
    restApi = 'publicApi',
  }: BootstrapOptions = {}): Promise<void> {
    this._restApiKey = restApi;

    const auth = new CognitoAuth(cognitoConfig);
    const { credentials, idToken } = await auth.login(
      testUserConfig.username,
      testUserConfig.password,
    );
    this._idToken = idToken;

    this.requester = new Requester(
      new GraphQL({ endpoint: graphqlConfig.endpoint, credentials }),
      new RestApi({
        baseUrl: restApiConfig[restApi],
        // public-api uses SigV4 (AWS_IAM); auth-api uses cookie from Cognito idToken
        credentials: restApi === 'publicApi' ? credentials : undefined,
        authHeaders:
          restApi === 'authApi' ? { Cookie: `project_access_token=${idToken}` } : undefined,
      }),
      this.detector,
    );

    await this.requester.bootstrap();
    await this.detector.bootstrap();
    await this.collector.bootstrap(logGroupArns);
    await this.db.connect();
  }

  /** Cognito `sub` of the logged-in test user — matches `authUser.userId` in Lambdas. */
  getAuthenticatedCognitoSub(): string {
    if (!this._idToken) {
      throw new Error(
        'LambdaTestApp.bootstrap() must be called before getAuthenticatedCognitoSub()',
      );
    }
    return parseCognitoSubFromIdToken(this._idToken);
  }

  /** Returns a Requester with no credentials — useful for testing unauthenticated access. */
  withoutAuth(): Requester {
    return new Requester(
      new GraphQL({ endpoint: graphqlConfig.endpoint }),
      new RestApi({ baseUrl: restApiConfig[this._restApiKey] }),
      this.detector,
    );
  }

  async terminate(): Promise<void> {
    await this.collector.terminate();
    await this.detector.terminate(this.collector);
    await this.db.disconnect();
  }
}

let instance: LambdaTestApp | undefined;

export function getLambdaTestApp(): LambdaTestApp {
  if (!instance) {
    instance = new LambdaTestApp();
  }
  return instance;
}
