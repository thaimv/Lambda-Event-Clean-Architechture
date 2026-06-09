import { DI } from '@common/constants/di.const';
import { AwsSqsMessageQueueDatasource } from '@common/datasources/message-queue/implements/aws-sqs.message-queue.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.MESSAGE_QUEUE_DATASOURCE,
      useClass: AwsSqsMessageQueueDatasource,
    },
  ],
})
export class MessageQueueDatasourceModule {}
