import { CloudWatchLogsClient, StartLiveTailCommand } from '@aws-sdk/client-cloudwatch-logs';

type AwsConfig = {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};
type CloudWatchConfig = { logFlushWait: number };

export interface ILogCollector {
  push(group: string, line: string): void;
  get(group: string): string[];
  groups(): string[];
  clear(): void;
  bootstrap(logGroupArns: string[]): Promise<void>;
  terminate(): Promise<void>;
}

export class LogCollector implements ILogCollector {
  private readonly buffers = new Map<string, string[]>();
  private stopFn?: () => void;

  constructor(
    private readonly awsConfig: AwsConfig,
    private readonly cloudwatchConfig: CloudWatchConfig,
  ) {}

  push(group: string, line: string): void {
    if (!this.buffers.has(group)) {
      this.buffers.set(group, []);
    }
    this.buffers.get(group)!.push(line);
  }

  get(group: string): string[] {
    return this.buffers.get(group) ?? [];
  }

  groups(): string[] {
    return Array.from(this.buffers.keys());
  }

  clear(): void {
    this.buffers.clear();
  }

  async bootstrap(logGroupArns: string[]): Promise<void> {
    this.clear();
    if (logGroupArns.length > 0) {
      this.stopFn = await this.startLiveTail(logGroupArns);
    }
  }

  async terminate(): Promise<void> {
    const waitTime = this.cloudwatchConfig.logFlushWait * 1000;
    await sleep(waitTime);
    this.stopFn?.();
  }

  private async startLiveTail(logGroupIdentifiers: string[]): Promise<() => void> {
    const abortController = new AbortController();
    const credentials =
      this.awsConfig.accessKeyId && this.awsConfig.secretAccessKey
        ? {
            accessKeyId: this.awsConfig.accessKeyId,
            secretAccessKey: this.awsConfig.secretAccessKey,
          }
        : undefined;

    const client = new CloudWatchLogsClient({
      region: this.awsConfig.region,
      credentials,
    });

    const command = new StartLiveTailCommand({ logGroupIdentifiers });
    const response = await client.send(command, { abortSignal: abortController.signal });

    console.log(`Started CloudWatch Logs Live Tail for:`, logGroupIdentifiers);

    const stream = response.responseStream;
    if (!stream) {
      throw new Error('Failed to initialize the live tail response stream.');
    }

    let signalStreamReady: () => void;
    const isStreamReady = new Promise<void>((resolve) => {
      signalStreamReady = resolve;
    });

    const consumeStream = async () => {
      try {
        for await (const event of stream) {
          if (event.sessionStart) {
            console.log(`Stream ready for:`, logGroupIdentifiers);
            signalStreamReady();
          }
          if (event.sessionUpdate) {
            const logs = event.sessionUpdate.sessionResults || [];
            for (const log of logs) {
              const group = log.logGroupIdentifier ?? 'unknown';
              const line = log.message ?? '';
              if (line) this.push(group, line);
            }
          }
        }
      } catch {
        // stream aborted on terminate — expected
      }
    };

    consumeStream();
    await isStreamReady;

    return () => {
      abortController.abort();
      client.destroy();
      console.log(`Stopped CloudWatch Logs Live Tail for:`, logGroupIdentifiers);
    };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
