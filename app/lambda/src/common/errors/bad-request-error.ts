import { RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class BadRequestError extends BaseError {
  constructor(message: string, details: any = undefined) {
    super(message, RESULT_CODE.BAD_REQUEST, STATUS_CODE.BAD_REQUEST, details);
  }
}
