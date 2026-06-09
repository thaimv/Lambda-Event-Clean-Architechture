import type { ApiGatewayResponseFormat } from '@common/constants/format.const';

export type ApiGatewayRequestOptions = {
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  query?: Record<string, string>;
};

export type ApiGatewayDatasourceResponseOptions = {
  format?: ApiGatewayResponseFormat;
};
