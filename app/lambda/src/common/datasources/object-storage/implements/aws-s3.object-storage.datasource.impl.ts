import type { Readable } from 'stream';

import type { S3Client } from '@aws-sdk/client-s3';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client as S3ClientClass,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DI } from '@common/constants/di.const';
import { ERROR_MESSAGE } from '@common/constants/response.const';
import type { IObjectStorageDatasource } from '@common/datasources/object-storage/object-storage.datasource';
import { BadRequestError } from '@common/errors/bad-request-error';
import { NotFoundError } from '@common/errors/notfound-error';
import { logger } from '@common/logger';
import type {
  ListObjectsInput,
  ListObjectsOutput,
  PutObjectInput,
  PutObjectOutput,
} from '@common/types/datasources/object-storage.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable, optional } from 'inversify';

const DELETE_FILES_LIMIT = 1000;

/**
 * AWS S3 adapter for object storage operations.
 */
@injectable()
export class AwsS3ObjectStorageDatasource implements IObjectStorageDatasource {
  protected readonly s3Client: S3Client;

  constructor(
    @inject(DI.APP_CONFIG)
    @optional()
    appConfig?: AppConfig,
  ) {
    this.s3Client = new S3ClientClass({
      region: appConfig!.awsConfig.region,
    });
  }

  /** Cross-account connector — bypasses Inversify (pre-configured S3Client) */
  static fromClient(s3Client: S3Client): AwsS3ObjectStorageDatasource {
    const instance = Object.create(
      AwsS3ObjectStorageDatasource.prototype,
    ) as AwsS3ObjectStorageDatasource;
    Object.assign(instance, { s3Client });
    return instance;
  }

  getS3Client(): S3Client {
    return this.s3Client;
  }

  async getFile(bucket: string, key: string, encoding?: string): Promise<string> {
    const getFileInS3 = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    const file = await getFileInS3?.Body?.transformToString(encoding);

    if (file == null) {
      throw new NotFoundError(ERROR_MESSAGE.FILE_NOT_FOUND.replace('<file_name>', key));
    }

    return file;
  }

  async getFileAsStream(bucket: string, key: string): Promise<Readable> {
    const res = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (!res?.Body) {
      throw new NotFoundError(ERROR_MESSAGE.FILE_NOT_FOUND.replace('<file_name>', key));
    }

    return res.Body as Readable;
  }

  async listObjects(input: ListObjectsInput, getAllObjects?: boolean): Promise<ListObjectsOutput> {
    if (!getAllObjects) {
      return this.s3Client.send(
        new ListObjectsV2Command(input as ConstructorParameters<typeof ListObjectsV2Command>[0]),
      );
    }

    let continuationToken: string | undefined = undefined;
    let allContents: ListObjectsOutput['Contents'] = [];
    let firstResponse: ListObjectsOutput | undefined = undefined;
    let hasNext = true;

    while (hasNext) {
      const response: ListObjectsOutput = await this.s3Client.send(
        new ListObjectsV2Command({
          ...input,
          ContinuationToken: continuationToken,
        } as ConstructorParameters<typeof ListObjectsV2Command>[0]),
      );

      if (!firstResponse) firstResponse = response;
      if (response.Contents) {
        allContents = [...allContents, ...response.Contents];
      }

      hasNext = !!response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    return {
      ...firstResponse,
      Contents: allContents,
      $metadata: firstResponse?.$metadata ?? {
        httpStatusCode: 200,
        requestId: '',
        extendedRequestId: '',
        cfId: '',
      },
    };
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  async deleteObjects(bucket: string, keys: string[]): Promise<void> {
    const chunks = Array.from({ length: Math.ceil(keys.length / DELETE_FILES_LIMIT) }, (_, i) =>
      keys.slice(i * DELETE_FILES_LIMIT, (i + 1) * DELETE_FILES_LIMIT),
    );

    await Promise.all(
      chunks.map((chunk) =>
        this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: chunk.map((key) => ({ Key: key })),
              Quiet: false,
            },
          }),
        ),
      ),
    );
  }

  async putObject(input: PutObjectInput): Promise<PutObjectOutput> {
    return this.s3Client.send(
      new PutObjectCommand(input as ConstructorParameters<typeof PutObjectCommand>[0]),
    );
  }

  async getFileAsBuffer(bucket: string, key: string): Promise<Buffer> {
    const getFileInS3 = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    const fileBuffer = await getFileInS3?.Body?.transformToByteArray();

    if (fileBuffer == null) {
      throw new NotFoundError(ERROR_MESSAGE.FILE_NOT_FOUND.replace('<file_name>', key));
    }

    return Buffer.from(fileBuffer);
  }

  async deleteDirectory(bucket: string, prefix: string): Promise<void> {
    const listedObjects = await this.listObjects({
      Bucket: bucket,
      Prefix: prefix,
    });

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return;
    }

    await this.deleteObjects(
      bucket,
      listedObjects.Contents.map(({ Key }) => Key!),
    );

    if (listedObjects.IsTruncated) {
      await this.deleteDirectory(bucket, prefix);
    }
  }

  async multipartUpload(input: PutObjectInput): Promise<PutObjectOutput> {
    logger.debug('--- Start stream upload file to object storage ---');

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: input.Bucket,
        Key: input.Key,
        Body: input.Body,
        ContentType: input.ContentType || 'application/octet-stream',
        Metadata: input.Metadata,
        ACL: input.ACL as
          | 'private'
          | 'public-read'
          | 'public-read-write'
          | 'authenticated-read'
          | 'aws-exec-read'
          | 'bucket-owner-read'
          | 'bucket-owner-full-control'
          | undefined,
        ServerSideEncryption: input.ServerSideEncryption as
          | 'AES256'
          | 'aws:kms'
          | 'aws:kms:dsse'
          | undefined,
      },
    });

    const result = await upload.done();

    if (result.$metadata.httpStatusCode !== 200) {
      throw new BadRequestError(ERROR_MESSAGE.UPLOAD_FILE_FAILED);
    }

    logger.debug('--- Stream upload files successfully ---');

    return result;
  }
}
