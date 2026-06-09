import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DI } from '@common/constants/di.const';
import { DynamoDBClientDatasource } from '@common/datasources/dynamodb/implements/dynamodb-client.datasource.impl';
import { DynamoDBServiceDatasource } from '@common/datasources/dynamodb/implements/dynamodb-service.datasource.impl';
import { DynamoDBDatasource } from '@common/datasources/dynamodb/implements/dynamodb.datasource.impl';
import { Module } from '@common/decorators/module.decorator';
import type { AppConfig } from '@lambda/config/app.config';
import { AppConfigModule } from '@lambda/config/di/app.config.di';
import { getInstance } from '@lambda/config/di/di.config';

@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: DI.DYNAMODB_RAW_CLIENT_DATASOURCE,
      useFactory: () => {
        const appConfig = getInstance<AppConfig>(DI.APP_CONFIG);
        const isLocalOrTest = appConfig.isLocal || appConfig.isTest;

        return new DynamoDBClient({
          region: appConfig.awsConfig.region,
          ...(isLocalOrTest ? { endpoint: appConfig.dynamoDBConfig.endpoint } : {}),
        });
      },
    },
    {
      provide: DI.DYNAMODB_CLIENT_DATASOURCE,
      useClass: DynamoDBClientDatasource,
    },
    {
      provide: DI.DYNAMODB_DATASOURCE,
      useClass: DynamoDBDatasource,
    },
    {
      provide: DI.DYNAMODB_SERVICE_DATASOURCE,
      useClass: DynamoDBServiceDatasource,
    },
  ],
})
export class DynamoDBDatasourceModule {}
