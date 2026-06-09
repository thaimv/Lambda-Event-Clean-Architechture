import { Module } from '@common/decorators/module.decorator';
import { DatabaseDatasourceModule } from '@lambda/config/di/datasources/database.di';
import { DELETE_USER_DI_CONST } from '@lambda/delete-user/consts';
import { DeleteUserPresenter } from '@lambda/delete-user/presenter/index.presenter';
import { UserRepo } from '@lambda/delete-user/repos/implements/user.repo.impl';
import { DeleteUserUseCase } from '@lambda/delete-user/usecases/implements/delete-user.uc.impl';

@Module({
  imports: [DatabaseDatasourceModule],
  providers: [
    {
      provide: DELETE_USER_DI_CONST.UserInfoRepo,
      useClass: UserRepo,
    },
    {
      provide: DELETE_USER_DI_CONST.DeleteUserUseCase,
      useClass: DeleteUserUseCase,
    },
    {
      provide: DELETE_USER_DI_CONST.Presenter,
      useClass: DeleteUserPresenter,
    },
  ],
})
export class DeleteUserModule {}
