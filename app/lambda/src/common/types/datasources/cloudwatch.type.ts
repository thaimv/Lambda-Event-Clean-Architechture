export type MetricDimension = {
  Name: string;
  Value: string;
};

export type StandardUnit = 'Count';

export type MetricDatum = {
  MetricName: string;
  Dimensions?: MetricDimension[];
  Timestamp?: Date;
  Value?: number;
  Unit?: StandardUnit;
};

export type PutMetricDataInput = {
  Namespace: string;
  MetricData: MetricDatum[];
};

export type PutMetricDataOutput = {
  $metadata?: {
    httpStatusCode?: number;
    requestId?: string;
  };
};
