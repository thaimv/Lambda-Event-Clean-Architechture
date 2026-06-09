import { DI } from '@common/constants/di.const';
import { LambdaDatasource } from '@common/datasources/lambda/implements/lambda.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.LAMBDA_DATASOURCE,
      useClass: LambdaDatasource,
    },
  ],
})
export class LambdaDatasourceModule {}
