import type { SQSClient } from '@aws-sdk/client-sqs';
import { DeleteMessageCommand } from '@aws-sdk/client-sqs';
import type { QueueRecord } from '@common/types/datasources/message-queue.type';
import type { IMessageQueueJob } from '@common/types/datasources/message-queue.type';

export class AwsSqsMessageQueueJobDatasource<T> implements IMessageQueueJob<T> {
  constructor(
    protected readonly queueRecord: QueueRecord,
    protected readonly sqsClient: SQSClient,
  ) {}

  protected cachedPayload?: T;

  getId(): string {
    return this.queueRecord.messageId;
  }

  getPayload(): T {
    if (this.cachedPayload === undefined) {
      this.cachedPayload = JSON.parse(this.queueRecord.body) as T;
    }

    return this.cachedPayload;
  }

  async delete(): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.getQueueUrlFromArn(this.queueRecord.eventSourceARN),
      ReceiptHandle: this.queueRecord.receiptHandle,
    });
    await this.sqsClient.send(command);
  }

  protected getQueueUrlFromArn(arn: string): string {
    const [, , service, region, accountId, queueName] = arn.split(':');
    return `https://${service}.${region}.amazonaws.com/${accountId}/${queueName}`;
  }
}
