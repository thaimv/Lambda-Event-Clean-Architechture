import type { APIGatewayProxyEvent } from 'aws-lambda';

export type ApiRequestLogInput = {
  body?: unknown;
  queryStringParameters?: APIGatewayProxyEvent['queryStringParameters'];
  pathParameters?: APIGatewayProxyEvent['pathParameters'];
};

const parseJsonString = (value: string | undefined | null): unknown | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const isApiGatewayProxyEvent = (input: unknown): input is APIGatewayProxyEvent => {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const event = input as APIGatewayProxyEvent & { rawPath?: string };
  const hasMethod = Boolean(event.httpMethod ?? event.requestContext?.http?.method);
  const hasPath = Boolean(event.path ?? event.rawPath ?? event.requestContext?.http?.path);

  return hasMethod && hasPath;
};

const getApiGatewayLogInput = (event: APIGatewayProxyEvent): ApiRequestLogInput => {
  const input: ApiRequestLogInput = {};
  const body = parseJsonString(event.body);

  if (body !== undefined) {
    input.body = body;
  }

  if (event.queryStringParameters) {
    input.queryStringParameters = event.queryStringParameters;
  }

  if (event.pathParameters) {
    input.pathParameters = event.pathParameters;
  }

  return input;
};

/**
 * Trims API Gateway events to user-provided request data only.
 * All other trigger inputs are logged as-is.
 */
export const getLambdaRequestLogInput = (input: unknown): unknown => {
  if (isApiGatewayProxyEvent(input)) {
    return getApiGatewayLogInput(input);
  }

  return input;
};
