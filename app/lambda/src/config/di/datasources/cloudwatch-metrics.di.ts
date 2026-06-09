import { DI } from '@common/constants/di.const';
import { CloudWatchMetricsDatasource } from '@common/datasources/cloudwatch/implements/cloudwatch-metrics.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.CLOUDWATCH_METRICS_DATASOURCE,
      useClass: CloudWatchMetricsDatasource,
    },
  ],
})
export class CloudWatchMetricsDatasourceModule {}
