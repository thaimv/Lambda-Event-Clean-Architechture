import type {
  PutMetricDataInput,
  PutMetricDataOutput,
} from '@common/types/datasources/cloudwatch.type';

/**
 * Interface for CloudWatch Metrics operations.
 */
export interface ICloudWatchMetricsDatasource {
  /**
   * Put metric data to CloudWatch.
   * @param input - The input for the put metric data command
   * @returns Promise<PutMetricDataOutput>
   */
  putMetricData(input: PutMetricDataInput): Promise<PutMetricDataOutput>;
}
