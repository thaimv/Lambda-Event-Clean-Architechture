import type { IMessageQueueJob, QueueRecord } from '@common/types/datasources/message-queue.type';

/**
 * Port for publishing and consuming messages from a queue.
 * Vendor-specific details (e.g. AWS SQS) are encapsulated in implementations.
 */
export interface IMessageQueueDatasource {
  /**
   * Push a message to the queue.
   */
  push(queueName: string, payload: string): Promise<void>;

  /**
   * Create a job instance from raw queue record data.
   */
  create<T>(rawJob: QueueRecord): IMessageQueueJob<T>;
}
