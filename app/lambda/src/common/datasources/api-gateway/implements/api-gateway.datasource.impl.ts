import { API_GATEWAY_RESPONSE_FORMAT } from '@common/constants/format.const';
import { BadRequestError } from '@common/errors/bad-request-error';
import { logger } from '@common/logger';
import type {
  ApiGatewayDatasourceResponseOptions,
  ApiGatewayRequestOptions,
} from '@common/types/datasources/api-gateway.type';
import { injectable } from 'inversify';

import type { IApiGatewayDatasource } from '../api-gateway.datasource';

@injectable()
export class ApiGatewayDatasource implements IApiGatewayDatasource {
  /**
   * Invokes API Gateway endpoint with specified HTTP method
   *
   * @param url - API Gateway endpoint URL
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param options - Additional request options (headers, body, etc.)
   * @returns Promise resolving to JSON response
   */
  async invoke<T>(
    url: string,
    method: string,
    reqOpts?: ApiGatewayRequestOptions,
    resOpts?: ApiGatewayDatasourceResponseOptions,
  ): Promise<T> {
    const body =
      typeof reqOpts?.body === 'string'
        ? reqOpts.body
        : reqOpts?.body
          ? JSON.stringify(reqOpts.body)
          : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(reqOpts?.headers || {}),
      },
      body,
    });

    const resRaw = await response.text();

    const isJsonFormat = !resOpts || resOpts.format === API_GATEWAY_RESPONSE_FORMAT.JSON;

    if (!response.ok) {
      logger.error(`call-api-gateway-failed`, {
        method: method,
        url: url,
        status: response.status,
        response: isJsonFormat ? JSON.parse(resRaw) : resRaw,
      });
      throw new BadRequestError(`call-api-gateway-failed: ${response.status}`, resRaw);
    }

    logger.info(`call-api-gateway-success`, {
      method: method,
      url: url,
      status: response.status,
      response: isJsonFormat ? JSON.parse(resRaw) : resRaw,
    });

    if (isJsonFormat) {
      return JSON.parse(resRaw) as T;
    }

    return resRaw as T;
  }
}
