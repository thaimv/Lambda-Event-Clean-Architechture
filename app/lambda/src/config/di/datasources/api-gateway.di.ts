import { DI } from '@common/constants/di.const';
import { ApiGatewayDatasource } from '@common/datasources/api-gateway/implements/api-gateway.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.API_GATEWAY_DATASOURCE,
      useClass: ApiGatewayDatasource,
    },
  ],
})
export class ApiGatewayDatasourceModule {}
