import { DI } from '@common/constants/di.const';
import { ElastiCacheCacheDatasource } from '@common/datasources/cache/implements/elasticache.cache.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.CACHE_DATASOURCE,
      useClass: ElastiCacheCacheDatasource,
    },
  ],
})
export class CacheDatasourceModule {}
