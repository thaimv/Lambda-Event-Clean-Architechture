import { RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class InternalServerError extends BaseError {
  constructor(message: string) {
    super(message, RESULT_CODE.INTERNAL_SERVER_ERROR, STATUS_CODE.INTERNAL_SERVER_ERROR);
  }
}
