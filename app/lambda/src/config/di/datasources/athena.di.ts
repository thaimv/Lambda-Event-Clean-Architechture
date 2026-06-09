import { DI } from '@common/constants/di.const';
import { AthenaDatasource } from '@common/datasources/athena/implements/athena.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.ATHENA_DATASOURCE,
      useClass: AthenaDatasource,
    },
  ],
})
export class AthenaDatasourceModule {}
