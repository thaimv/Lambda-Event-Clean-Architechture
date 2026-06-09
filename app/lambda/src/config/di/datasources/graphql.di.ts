import { DI } from '@common/constants/di.const';
import { GraphQLDatasource } from '@common/datasources/graphql/implements/graphql.datasource.impl';
import { Module } from '@common/decorators/module.decorator';
import { LambdaDatasourceModule } from '@lambda/config/di/datasources/lambda.di';

@Module({
  imports: [LambdaDatasourceModule],
  providers: [
    {
      provide: DI.GRAPHQL_DATASOURCE,
      useClass: GraphQLDatasource,
    },
  ],
})
export class GraphQLDatasourceModule {}
