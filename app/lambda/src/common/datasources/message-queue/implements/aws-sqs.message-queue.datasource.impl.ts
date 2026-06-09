import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { DI } from '@common/constants/di.const';
import { AwsSqsMessageQueueJobDatasource } from '@common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl';
import type { IMessageQueueDatasource } from '@common/datasources/message-queue/message-queue.datasource';
import type { IMessageQueueJob, QueueRecord } from '@common/types/datasources/message-queue.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

/**
 * AWS SQS adapter for message queue operations.
 */
@injectable()
export class AwsSqsMessageQueueDatasource implements IMessageQueueDatasource {
  private readonly sqsClient: SQSClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.sqsClient = new SQSClient({ region: appConfig.awsConfig.region });
  }

  create<T>(rawJob: QueueRecord): IMessageQueueJob<T> {
    return new AwsSqsMessageQueueJobDatasource<T>(rawJob, this.sqsClient);
  }

  async push(queueName: string, payload: string): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: queueName,
      MessageBody: payload,
    });
    await this.sqsClient.send(command);
  }
}
