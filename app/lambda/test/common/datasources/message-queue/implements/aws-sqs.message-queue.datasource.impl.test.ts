import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AwsSqsMessageQueueJobDatasource } from '@common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl';
import { AwsSqsMessageQueueDatasource } from '@common/datasources/message-queue/implements/aws-sqs.message-queue.datasource.impl';
import type { QueueRecord } from '@common/types/datasources/message-queue.type';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const sqsMock = mockClient(SQSClient);

vi.mock(
  '@common/datasources/message-queue/implements/aws-sqs.message-queue-job.datasource.impl',
  () => ({
    AwsSqsMessageQueueJobDatasource: vi.fn(),
  }),
);

describe('AwsSqsMessageQueueDatasource', () => {
  let messageQueueDatasource: AwsSqsMessageQueueDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    sqsMock.reset();
    messageQueueDatasource = new AwsSqsMessageQueueDatasource(createMockAppConfig());
  });

  describe('create', () => {
    it('should create a new AwsSqsMessageQueueJobDatasource with the provided raw job', () => {
      const mockRawJob: QueueRecord = {
        messageId: 'test-message-id',
        receiptHandle: 'test-receipt-handle',
        body: JSON.stringify({ test: 'data' }),
        eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
      };

      const mockJobInstance = { payload: { test: 'data' } };
      (AwsSqsMessageQueueJobDatasource as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        mockJobInstance,
      );

      const result = messageQueueDatasource.create(mockRawJob);
      const sqsClient = (messageQueueDatasource as unknown as { sqsClient: SQSClient }).sqsClient;

      expect(AwsSqsMessageQueueJobDatasource).toHaveBeenCalledWith(mockRawJob, sqsClient);
      expect(result).toBe(mockJobInstance);
    });

    it('should create AwsSqsMessageQueueJobDatasource with typed payload', () => {
      interface TestPayload {
        userId: string;
        action: string;
      }

      const mockRawJob: QueueRecord = {
        messageId: 'test-id',
        receiptHandle: 'handle',
        body: JSON.stringify({ userId: '123', action: 'test' }),
        eventSourceARN: 'arn',
      };

      const mockTypedJob = { payload: { userId: '123', action: 'test' } };
      (AwsSqsMessageQueueJobDatasource as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTypedJob,
      );

      const result = messageQueueDatasource.create<TestPayload>(mockRawJob);
      const sqsClient = (messageQueueDatasource as unknown as { sqsClient: SQSClient }).sqsClient;

      expect(AwsSqsMessageQueueJobDatasource).toHaveBeenCalledWith(mockRawJob, sqsClient);
      expect(result).toBe(mockTypedJob);
    });
  });

  describe('push', () => {
    it('should send message to SQS with correct parameters', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data', timestamp: Date.now() });

      sqsMock.on(SendMessageCommand).resolves({});

      await messageQueueDatasource.push(queueUrl, payload);

      expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(1);
      expect(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input).toEqual({
        QueueUrl: queueUrl,
        MessageBody: payload,
      });
    });

    it('should propagate errors from SQS client', async () => {
      const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
      const payload = JSON.stringify({ test: 'data' });
      const error = new Error('SQS send failed');

      sqsMock.on(SendMessageCommand).rejects(error);

      await expect(messageQueueDatasource.push(queueUrl, payload)).rejects.toThrow(
        'SQS send failed',
      );
    });
  });

  describe('constructor', () => {
    it('should create datasource instance', () => {
      const datasource = new AwsSqsMessageQueueDatasource(createMockAppConfig());
      expect(datasource).toBeInstanceOf(AwsSqsMessageQueueDatasource);
    });
  });
});
