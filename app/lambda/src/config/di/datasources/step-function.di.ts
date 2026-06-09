import { DI } from '@common/constants/di.const';
import { StepFunctionDatasource } from '@common/datasources/step-function/implements/step-function.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.STEP_FUNCTION_DATASOURCE,
      useClass: StepFunctionDatasource,
    },
  ],
})
export class StepFunctionDatasourceModule {}
