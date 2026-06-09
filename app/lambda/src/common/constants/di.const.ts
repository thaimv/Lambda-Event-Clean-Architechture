export const DI = {
  // Common Providers
  APP_CONFIG: Symbol.for('AppConfig'),

  // Common Datasources
  ATHENA_DATASOURCE: Symbol.for('AthenaDatasource'),
  LAMBDA_DATASOURCE: Symbol.for('LambdaDatasource'),
  CLOUDWATCH_METRICS_DATASOURCE: Symbol.for('CloudWatchMetricsDatasource'),
  TRANSACTION_RUNNER_DATASOURCE: Symbol.for('TransactionRunnerDatasource'),
  PUSH_NOTIFICATION_DATASOURCE: Symbol.for('PushNotificationDatasource'),
  DYNAMODB_DATASOURCE: Symbol.for('DynamoDBDatasource'),
  API_GATEWAY_DATASOURCE: Symbol.for('ApiGatewayDatasource'),
  DB_CLIENT_DATASOURCE: Symbol.for('DatabaseClientDatasource'),
  MESSAGE_QUEUE_DATASOURCE: Symbol.for('MessageQueueDatasource'),
  PARQUET_FILE_DATASOURCE: Symbol.for('ParquetFileDatasource'),
  EMAIL_DATASOURCE: Symbol.for('EmailDatasource'),
  TRANSLATE_DATASOURCE: Symbol.for('TranslateDatasource'),
  COGNITO_IDENTITY_DATASOURCE: Symbol.for('CognitoIdentityDatasource'),
  OBJECT_STORAGE_UPLOAD_DATASOURCE: Symbol.for('ObjectStorageUploadDatasource'),
  DYNAMODB_CLIENT_DATASOURCE: Symbol.for('DynamoDBClientDatasource'),
  DYNAMODB_RAW_CLIENT_DATASOURCE: Symbol.for('DynamoDBRawClientDatasource'),
  SECRETS_MANAGER_DATASOURCE: Symbol.for('SecretsManagerDatasource'),
  OBJECT_STORAGE_CONNECTOR_DATASOURCE: Symbol.for('ObjectStorageConnectorDatasource'),
  OBJECT_STORAGE_DATASOURCE: Symbol.for('ObjectStorageDatasource'),
  STEP_FUNCTION_DATASOURCE: Symbol.for('StepFunctionDatasource'),
  DYNAMODB_SERVICE_DATASOURCE: Symbol.for('DynamoDBServiceDatasource'),
  GRAPHQL_DATASOURCE: Symbol.for('GraphQLDatasource'),
  CACHE_DATASOURCE: Symbol.for('CacheDatasource'),

  // Common Repositories
  COMMON_USER_REPO: Symbol.for('CommonUserRepo'),
};
