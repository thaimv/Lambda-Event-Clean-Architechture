import { RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, RESULT_CODE.NOT_FOUND, STATUS_CODE.NOT_FOUND);
  }
}
