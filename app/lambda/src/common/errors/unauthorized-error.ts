import { ERROR_MESSAGE, RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class UnauthorizedError extends BaseError {
  constructor(message: string = ERROR_MESSAGE.UNAUTHORIZED) {
    super(message, RESULT_CODE.UNAUTHORIZED, STATUS_CODE.UNAUTHORIZED);
  }
}
