import type { BaseError } from '@common/errors/base-error';

export class ErrorResponse<T = any> {
  constructor(
    public code: string,
    public message: string,
    public detail: T,
  ) {}

  static fromError<T = any>(error: BaseError) {
    return new ErrorResponse<T>(error.code, error.message, error.details as T);
  }

  render() {
    return {
      result: {
        code: this.code,
        message: this.message,
      },
      error: {
        error_message: this.message,
        error_detail: this.detail ?? null,
      },
    };
  }
}
