import { DI } from '@common/constants/di.const';
import { Module } from '@common/decorators/module.decorator';
import { AppConfig } from '@lambda/config/app.config';

@Module({
  providers: [
    {
      provide: DI.APP_CONFIG,
      useClass: AppConfig,
    },
  ],
})
export class AppConfigModule {}
