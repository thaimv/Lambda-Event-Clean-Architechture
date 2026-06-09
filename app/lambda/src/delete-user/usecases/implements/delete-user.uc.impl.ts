import { DELETE_USER_SOFT_DELETE_RETENTION_YEARS } from '@common/constants/app.const';
import { logger } from '@common/logger';
import { DELETE_USER_DI_CONST } from '@lambda/delete-user/consts';
import type { IUserRepo } from '@lambda/delete-user/repos/user.repo';
import type { IDeleteUserUseCase } from '@lambda/delete-user/usecases/delete-user.uc';
import { inject, injectable } from 'inversify';

@injectable()
export class DeleteUserUseCase implements IDeleteUserUseCase {
  constructor(
    @inject(DELETE_USER_DI_CONST.UserInfoRepo)
    private readonly userInfoRepo: IUserRepo,
  ) {}

  async execute(): Promise<void> {
    const cutoffDatetime = new Date();
    cutoffDatetime.setFullYear(
      cutoffDatetime.getFullYear() - DELETE_USER_SOFT_DELETE_RETENTION_YEARS,
    );

    const deletedCount = await this.userInfoRepo.deleteSoftDeletedUsersBefore(cutoffDatetime);

    logger.info('Deleted soft-deleted users from user_information', {
      retentionYears: DELETE_USER_SOFT_DELETE_RETENTION_YEARS,
      cutoffDatetime: cutoffDatetime.toISOString(),
      deletedCount,
    });
  }
}
