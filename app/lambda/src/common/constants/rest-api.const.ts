/**
 * Enum representing the standard HTTP methods.  This helps ensure type safety
 * and readability when working with HTTP requests.  Using enums instead of
 * string literals prevents typos and makes refactoring easier.
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Enum representing common HTTP status codes.  Similar to `HttpMethod`, this
 * provides type safety and improves code clarity when handling responses
 * from HTTP requests.  It's better than using magic numbers.
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
