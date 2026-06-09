import { RESULT_CODE, STATUS_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';

export class SecretsNotFoundError extends BaseError {
  constructor(message: string) {
    super(message, RESULT_CODE.SECRETS_NOT_FOUND, STATUS_CODE.NOT_FOUND);
  }
}
