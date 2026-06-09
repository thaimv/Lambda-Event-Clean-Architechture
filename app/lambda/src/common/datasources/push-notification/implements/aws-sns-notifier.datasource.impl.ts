import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { INotifierDatasource } from '@common/datasources/push-notification/push-notification.datasource';

export class SnsNotifierDatasource implements INotifierDatasource {
  constructor(protected readonly snsClient: SNSClient = new SNSClient()) {}

  async publishMessage(receiver: string, message: string): Promise<void> {
    const command = new PublishCommand({
      TargetArn: receiver,
      Message: message,
      MessageStructure: 'json',
    });
    await this.snsClient.send(command);
  }
}
