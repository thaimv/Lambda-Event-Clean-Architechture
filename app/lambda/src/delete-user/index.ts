import { Lambda } from '@common/lambda/lambda';
import { getInstance, bootstrapApplication } from '@lambda/config/di/di.config';
import { DELETE_USER_DI_CONST } from '@lambda/delete-user/consts';
import { DeleteUserModule } from '@lambda/delete-user/module';
import type { DeleteUserPresenter } from '@lambda/delete-user/presenter/index.presenter';
import type { APIGatewayProxyEvent } from 'aws-lambda';

bootstrapApplication(DeleteUserModule);

/**
 * @function handler
 * @description AWS Lambda handler function for deleting user information.
 */
export const handler = new Lambda<APIGatewayProxyEvent, void>((event, _context) =>
  getInstance<DeleteUserPresenter>(DELETE_USER_DI_CONST.Presenter).handle(event),
).createHandler();
