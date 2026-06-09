import { DeleteMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AwsSqsMessageQueueJobDatasource } from '@common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl';
import type { QueueRecord } from '@common/types/datasources/message-queue.type';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const sqsClientMock = mockClient(SQSClient);

describe('AwsSqsMessageQueueJobDatasource', () => {
  const queueRecord: QueueRecord = {
    messageId: 'msg-123',
    receiptHandle: 'handle-456',
    body: '{"foo":"bar"}',
    eventSourceARN: 'arn:aws:sqs:ap-southeast-1:123456789012:test-queue',
  };

  let job: AwsSqsMessageQueueJobDatasource<{ foo: string }>;
  let mockSqsClient: SQSClient;

  beforeEach(() => {
    sqsClientMock.reset();
    vi.clearAllMocks();
    mockSqsClient = new SQSClient({});
    job = new AwsSqsMessageQueueJobDatasource(queueRecord, mockSqsClient);
  });

  test('getId should return messageId', () => {
    expect(job.getId()).toBe('msg-123');
  });

  test('getPayload should parse and return body', () => {
    expect(job.getPayload()).toEqual({ foo: 'bar' });
  });

  test('getPayload should cache parsed payload', () => {
    const payload1 = job.getPayload();
    const payload2 = job.getPayload();
    expect(payload1).toBe(payload2);
  });

  test('delete should call sqs.deleteMessage with correct params', async () => {
    sqsClientMock.on(DeleteMessageCommand).resolves({});

    await job.delete();

    expect(sqsClientMock.calls()).toHaveLength(1);
    const call = sqsClientMock.call(0);
    expect(call.args[0].input).toEqual({
      QueueUrl: 'https://sqs.ap-southeast-1.amazonaws.com/123456789012/test-queue',
      ReceiptHandle: 'handle-456',
    });
  });

  test('getQueueUrlFromArn should convert ARN to QueueUrl', () => {
    const arn = 'arn:aws:sqs:ap-southeast-1:123456789012:test-queue';
    const url = job['getQueueUrlFromArn'](arn);
    expect(url).toBe('https://sqs.ap-southeast-1.amazonaws.com/123456789012/test-queue');
  });

  test('getPayload should throw error if body is invalid JSON', () => {
    const invalidRecord = { ...queueRecord, body: 'not-json' };
    const invalidJob = new AwsSqsMessageQueueJobDatasource(invalidRecord, mockSqsClient);
    expect(() => invalidJob.getPayload()).toThrow();
  });
});
