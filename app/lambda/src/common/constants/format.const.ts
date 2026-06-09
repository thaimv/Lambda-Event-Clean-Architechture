export const API_GATEWAY_RESPONSE_FORMAT = {
  JSON: 'json',
  TEXT: 'text',
} as const;

export type ApiGatewayResponseFormat =
  (typeof API_GATEWAY_RESPONSE_FORMAT)[keyof typeof API_GATEWAY_RESPONSE_FORMAT];
