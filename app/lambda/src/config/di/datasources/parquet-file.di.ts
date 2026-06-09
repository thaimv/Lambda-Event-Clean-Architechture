import { DI } from '@common/constants/di.const';
import { ParquetFileDatasource } from '@common/datasources/parquet-file/implements/parquet-file.datasource.impl';
import { Module } from '@common/decorators/module.decorator';

@Module({
  providers: [
    {
      provide: DI.PARQUET_FILE_DATASOURCE,
      useClass: ParquetFileDatasource,
    },
  ],
})
export class ParquetFileDatasourceModule {}
