import { DI } from '@common/constants/di.const';
import { NotificationDatasource } from '@common/datasources/push-notification/implements/push-notification.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.PUSH_NOTIFICATION_DATASOURCE,
      useClass: NotificationDatasource,
    },
  ],
})
export class PushNotificationDatasourceModule {}
