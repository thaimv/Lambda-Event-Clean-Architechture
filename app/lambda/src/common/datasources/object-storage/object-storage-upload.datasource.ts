import type { Readable } from 'stream';

/**
 * Port for stream/buffer upload operations to object storage.
 * Used by providers with a simpler upload API (e.g. GCP GCS).
 */
export interface IObjectStorageUploadDatasource {
  uploadFileWithStream(bucketName: string, filePath: string, stream: Readable): Promise<void>;
  uploadFile(bucketName: string, filePath: string, buffer: Buffer): Promise<void>;
}
