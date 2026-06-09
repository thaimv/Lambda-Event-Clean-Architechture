import { DI } from '@common/constants/di.const';
import { SecretsManagerDatasource } from '@common/datasources/secrets-manager/implements/secrets-manager.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.SECRETS_MANAGER_DATASOURCE,
      useClass: SecretsManagerDatasource,
    },
  ],
})
export class SecretsManagerDatasourceModule {}
