export type QueueRecord = {
  messageId: string;
  receiptHandle: string;
  body: string;
  eventSourceARN: string;
};

export interface IMessageQueueJob<T> {
  getId(): string;
  getPayload(): T;
  delete(): Promise<void>;
}
