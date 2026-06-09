import { DELETE_USER_DI_CONST } from '@lambda/delete-user/consts';
import type { IDeleteUserUseCase } from '@lambda/delete-user/usecases/delete-user.uc';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { inject, injectable } from 'inversify';

@injectable()
export class DeleteUserPresenter {
  constructor(
    @inject(DELETE_USER_DI_CONST.DeleteUserUseCase)
    private readonly useCase: IDeleteUserUseCase,
  ) {}

  async handle(_event: APIGatewayProxyEvent): Promise<void> {
    await this.useCase.execute();
  }
}
