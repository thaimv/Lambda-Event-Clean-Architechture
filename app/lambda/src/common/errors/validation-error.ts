import { RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class ValidationError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, RESULT_CODE.VALIDATION_BUSINESS_ERROR, STATUS_CODE.BAD_REQUEST, details);
  }
}
