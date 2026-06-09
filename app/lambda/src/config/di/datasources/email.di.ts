import { DI } from '@common/constants/di.const';
import { AwsSesEmailDatasource } from '@common/datasources/email/implements/aws-ses.email.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.EMAIL_DATASOURCE,
      useClass: AwsSesEmailDatasource,
    },
  ],
})
export class EmailDatasourceModule {}
