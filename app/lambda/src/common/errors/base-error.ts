export class BaseError extends Error {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toCustomError() {
    return {
      error: {
        message: this.message,
        extensions: {
          code: this.code,
          statusCode: this.statusCode,
          details: this.details ?? null,
        },
      },
    };
  }
}
