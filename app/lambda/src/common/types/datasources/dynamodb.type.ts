export type AttributeValue = Record<string, unknown>;

export type DynamoDbItem = Record<string, unknown>;

/** Opaque low-level DynamoDB client handle — DynamoDBClient is only cast inside datasource implementations. */
export type DynamoDbRawClient = object;

/** Opaque DynamoDB Document Client handle — DynamoDBDocumentClient is only cast inside datasource implementations. */
export type DynamoDbDocumentClient = object;

export type DynamoDbDeleteItemOutput = {
  ConsumedCapacity?: unknown;
  $metadata?: unknown;
};

export type DynamoDbQueryInput = {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression?: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
  ProjectionExpression?: string;
  ScanIndexForward?: boolean;
};

export type DynamoDbQueryOutput = {
  Items?: Record<string, unknown>[];
  Count?: number;
  ScannedCount?: number;
  LastEvaluatedKey?: Record<string, unknown>;
  $metadata?: unknown;
};

export type DynamoDbScanInput = {
  TableName: string;
  IndexName?: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
  ProjectionExpression?: string;
};

export type DynamoDbScanOutput = {
  Items?: Record<string, unknown>[];
  Count?: number;
  ScannedCount?: number;
  LastEvaluatedKey?: Record<string, unknown>;
  $metadata?: unknown;
};

export type DynamoDbDocumentQueryInput = {
  TableName: string;
  IndexName?: string;
  KeyConditionExpression?: string;
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  Limit?: number;
  ExclusiveStartKey?: Record<string, unknown>;
  ProjectionExpression?: string;
  ScanIndexForward?: boolean;
};

export type DynamoDbDocumentUpdateInput = {
  TableName: string;
  Key: Record<string, unknown>;
  UpdateExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
  ReturnValues?: string;
};

export type WriteRequest = {
  DeleteRequest?: {
    Key: Record<string, unknown>;
  };
  PutRequest?: {
    Item: Record<string, unknown>;
  };
};
