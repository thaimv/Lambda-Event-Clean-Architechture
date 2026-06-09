import { SENSITIVE_FIELDS } from '@common/constants/app.const';
import { awsConfig, cloudwatchConfig } from '@e2e/config';
import { LogCollector, type ILogCollector } from '@e2e/helpers/cloudwatch-logs';
import { DbClient } from '@e2e/helpers/db';
import { Invoker } from '@e2e/helpers/invoker';
import {
  type ISensitiveLeakDetector,
  SensitiveLeakDetector,
} from '@e2e/helpers/sensitive-leak-detector';

export type BootstrapOptions = {
  logGroupArns?: string[];
};

/**
 * Thin orchestrator for event-driven Lambda E2E suites (`tests/e2e/event/`).
 *
 * Mirrors `api-test-app.ts` in LambdaAPIs — no Cognito login; invokes deployed Lambdas
 * directly via AWS SDK.
 *
 * Usage:
 *   const app = getEventTestApp();
 *   beforeAll(async () => await app.bootstrap({ logGroupArns: [...] }), e2eHookTimeouts.beforeAll);
 *   afterAll(async () => await app.terminate(), e2eHookTimeouts.afterAll);
 *
 *   app.invoker.invoke(lambdaConfig.deleteUser, event)
 *   app.db.client.user.findUnique(...)
 */
export class EventTestApp {
  readonly collector: ILogCollector;
  readonly detector: ISensitiveLeakDetector;
  readonly invoker: Invoker;
  readonly db: DbClient;

  constructor() {
    this.detector = new SensitiveLeakDetector([...SENSITIVE_FIELDS.hash, ...SENSITIVE_FIELDS.mask]);
    this.collector = new LogCollector(awsConfig, cloudwatchConfig);
    this.invoker = new Invoker(awsConfig);
    this.db = new DbClient();
  }

  async bootstrap({ logGroupArns = [] }: BootstrapOptions = {}): Promise<void> {
    await this.detector.bootstrap();
    await this.collector.bootstrap(logGroupArns);
    await this.db.connect();
  }

  async terminate(): Promise<void> {
    await this.collector.terminate();
    await this.detector.terminate(this.collector);
    await this.db.disconnect();
  }
}

let instance: EventTestApp | undefined;

export function getEventTestApp(): EventTestApp {
  if (!instance) {
    instance = new EventTestApp();
  }
  return instance;
}
