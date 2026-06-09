import { DI } from '@common/constants/di.const';
import { AwsS3ObjectStorageConnectorDatasource } from '@common/datasources/object-storage/implements/aws-s3.object-storage-connector.datasource.impl';
import { AwsS3ObjectStorageDatasource } from '@common/datasources/object-storage/implements/aws-s3.object-storage.datasource.impl';
import { GcpGcsObjectStorageUploadDatasource } from '@common/datasources/object-storage/implements/gcp-gcs.object-storage-upload.datasource.impl';
import { Module } from '@common/decorators/module.decorator';
import { SecretsManagerDatasourceModule } from '@lambda/config/di/datasources/secrets-manager.di';

@Module({
  imports: [SecretsManagerDatasourceModule],
  providers: [
    {
      provide: DI.OBJECT_STORAGE_CONNECTOR_DATASOURCE,
      useClass: AwsS3ObjectStorageConnectorDatasource,
    },
    {
      provide: DI.OBJECT_STORAGE_DATASOURCE,
      useClass: AwsS3ObjectStorageDatasource,
    },
    {
      provide: DI.OBJECT_STORAGE_UPLOAD_DATASOURCE,
      useClass: GcpGcsObjectStorageUploadDatasource,
    },
  ],
})
export class ObjectStorageDatasourceModule {}
