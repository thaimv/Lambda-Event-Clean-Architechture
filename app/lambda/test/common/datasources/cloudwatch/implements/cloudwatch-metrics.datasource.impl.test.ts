import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchMetricsDatasource } from '@common/datasources/cloudwatch/implements/cloudwatch-metrics.datasource.impl';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const cloudWatchMock = mockClient(CloudWatchClient);

describe('CloudWatch Metrics Provider', () => {
  let cloudWatchMetrics: CloudWatchMetricsDatasource;
  let mockCloudWatchClient: CloudWatchClient;

  beforeEach(() => {
    cloudWatchMock.reset();
    mockCloudWatchClient = new CloudWatchClient({});
    cloudWatchMetrics = new CloudWatchMetricsDatasource(createMockAppConfig());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create CloudWatchMetricsDatasource instance', () => {
      const metrics = new CloudWatchMetricsDatasource(createMockAppConfig());

      expect(metrics).toBeInstanceOf(CloudWatchMetricsDatasource);
    });
  });

  describe('putMetricData', () => {
    test('should successfully put metric data', async () => {
      const input = {
        Namespace: 'TestNamespace',
        MetricData: [
          {
            MetricName: 'TestMetric',
            Value: 1,
            Unit: 'Count' as const,
          },
        ],
      };

      const expectedOutput = {
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      cloudWatchMock.on(PutMetricDataCommand).resolves(expectedOutput);

      const result = await cloudWatchMetrics.putMetricData(input);

      expect(result).toEqual(expectedOutput);
      expect(cloudWatchMock.commandCalls(PutMetricDataCommand)).toHaveLength(1);
      expect(cloudWatchMock.commandCalls(PutMetricDataCommand)[0].args[0].input).toEqual(input);
    });

    test('should throw an error if CloudWatch client fails', async () => {
      const input = {
        Namespace: 'TestNamespace',
        MetricData: [
          {
            MetricName: 'TestMetric',
            Value: 1,
            Unit: 'Count' as const,
          },
        ],
      };

      const error = new Error('CloudWatch Error: Invalid namespace');
      cloudWatchMock.on(PutMetricDataCommand).rejects(error);

      await expect(cloudWatchMetrics.putMetricData(input)).rejects.toThrow(error);
    });
  });
});
