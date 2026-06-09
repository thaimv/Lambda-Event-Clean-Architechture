import { DI } from '@common/constants/di.const';
import { Module } from '@common/decorators/module.decorator';
import { UserRepo } from '@common/repos/user/implements/user.impl';
import { DatabaseDatasourceModule } from '@lambda/config/di/datasources/database.di';

@Module({
  imports: [DatabaseDatasourceModule],
  providers: [
    {
      provide: DI.COMMON_USER_REPO,
      useClass: UserRepo,
    },
  ],
})
export class CommonUserRepo {}
