import { DI } from '@common/constants/di.const';
import { PrismaDBClientDatasource } from '@common/datasources/database/implements/prisma-db-client.datasource.impl';
import { PrismaTransactionRunnerDatasource } from '@common/datasources/database/implements/prisma-transaction-runner.datasource.impl';
import { Module } from '@common/decorators/module.decorator';
import { AppConfigModule } from '@lambda/config/di/app.config.di';
import { SecretsManagerDatasourceModule } from '@lambda/config/di/datasources/secrets-manager.di';

@Module({
  imports: [AppConfigModule, SecretsManagerDatasourceModule],
  providers: [
    {
      provide: DI.DB_CLIENT_DATASOURCE,
      useClass: PrismaDBClientDatasource,
    },
    {
      provide: DI.TRANSACTION_RUNNER_DATASOURCE,
      useClass: PrismaTransactionRunnerDatasource,
    },
  ],
})
export class DatabaseDatasourceModule {}
