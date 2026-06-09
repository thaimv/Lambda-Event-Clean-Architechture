import { DI } from '@common/constants/di.const';
import { TranslateDatasource } from '@common/datasources/translate/implements/translate.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.TRANSLATE_DATASOURCE,
      useClass: TranslateDatasource,
    },
  ],
})
export class TranslateDatasourceModule {}
