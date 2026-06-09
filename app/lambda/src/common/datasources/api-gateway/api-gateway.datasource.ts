import type {
  ApiGatewayDatasourceResponseOptions,
  ApiGatewayRequestOptions,
} from '@common/types/datasources/api-gateway.type';

export interface IApiGatewayDatasource {
  invoke<T>(
    url: string,
    method: string,
    reqOpts?: ApiGatewayRequestOptions,
    resOpts?: ApiGatewayDatasourceResponseOptions,
  ): Promise<T>;
}
