import { RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class DatabaseUrlNotFoundError extends BaseError {
  constructor(message: string) {
    super(message, RESULT_CODE.DATABASE_URL_NOT_FOUND, STATUS_CODE.NOT_FOUND);
  }
}
