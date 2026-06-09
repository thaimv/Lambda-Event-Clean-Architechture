import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AwsS3ObjectStorageDatasource } from '@common/datasources/object-storage/implements/aws-s3.object-storage.datasource.impl';
import { NotFoundError } from '@common/errors/notfound-error';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const uploadDoneMock = vi.fn();
vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn(),
}));

vi.mock('@common/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock AWS SDK S3Client
const s3Mock = mockClient(S3Client);

// eslint-disable-next-line max-lines-per-function
describe('AwsS3ObjectStorageDatasource Provider', () => {
  let s3Provider: AwsS3ObjectStorageDatasource;
  let mockS3Client: S3Client;

  beforeEach(() => {
    s3Mock.reset();
    vi.clearAllMocks();
    mockS3Client = new S3Client({});
    s3Provider = new AwsS3ObjectStorageDatasource(createMockAppConfig());
    vi.mocked(Upload).mockImplementation(() => ({ done: uploadDoneMock }) as never);
    uploadDoneMock.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create S3 instance with default client when no client provided', () => {
      const s3 = new AwsS3ObjectStorageDatasource(createMockAppConfig());

      expect(s3.getS3Client()).toBeInstanceOf(S3Client);
    });
  });

  describe('getFile', () => {
    test('should successfully get file content from S3', async () => {
      const mockFileContent = 'test file content';
      const mockBody = {
        transformToString: vi.fn().mockResolvedValue(mockFileContent),
      } as any;

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody,
      });

      const result = await s3Provider.getFile('test-bucket', 'test-key');

      expect(result).toBe(mockFileContent);
      expect(mockBody.transformToString).toHaveBeenCalled();
      expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
      expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Key: 'test-key',
      });
    });

    test('should throw NotFoundError when file body is null', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: null as any,
      });

      await expect(s3Provider.getFile('test-bucket', 'test-key')).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError when file body is undefined', async () => {
      s3Mock.on(GetObjectCommand).resolves({
        Body: undefined,
      });

      await expect(s3Provider.getFile('test-bucket', 'test-key')).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError when transformToString returns null', async () => {
      const mockBody = {
        transformToString: vi.fn().mockResolvedValue(null),
      } as any;

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody,
      });

      await expect(s3Provider.getFile('test-bucket', 'test-key')).rejects.toThrow(NotFoundError);
    });

    test('should throw NotFoundError when transformToString returns undefined', async () => {
      const mockBody = {
        transformToString: vi.fn().mockResolvedValue(undefined),
      } as any;

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody,
      });

      await expect(s3Provider.getFile('test-bucket', 'test-key')).rejects.toThrow(NotFoundError);
    });

    test('should handle S3 client errors', async () => {
      const s3Error = new Error('S3 access denied');
      s3Mock.on(GetObjectCommand).rejects(s3Error);

      await expect(s3Provider.getFile('test-bucket', 'test-key')).rejects.toThrow(
        'S3 access denied',
      );
    });

    test('should handle transformToString errors', async () => {
      const mockBody = {
        transformToString: vi.fn().mockRejectedValue(new Error('Transform error')),
      } as any;

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockBody,
      });

      await expect(s3Provider.getFile('test-bucket', 'test-key')).rejects.toThrow(
        'Transform error',
      );
    });
  });

  describe('listObjects', () => {
    test('should successfully list objects in S3 bucket', async () => {
      const mockResponse = {
        Contents: [
          { Key: 'file1.txt', Size: 1024 },
          { Key: 'file2.txt', Size: 2048 },
        ],
        IsTruncated: false,
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(ListObjectsV2Command).resolves(mockResponse);

      const input = {
        Bucket: 'test-bucket',
        Prefix: 'test-prefix/',
      };

      const result = await s3Provider.listObjects(input);

      expect(result).toEqual(mockResponse);
      expect(s3Mock.commandCalls(ListObjectsV2Command)).toHaveLength(1);
      expect(s3Mock.commandCalls(ListObjectsV2Command)[0].args[0].input).toEqual(input);
    });

    test('should handle empty bucket', async () => {
      const mockResponse = {
        Contents: [],
        IsTruncated: false,
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(ListObjectsV2Command).resolves(mockResponse);

      const input = {
        Bucket: 'empty-bucket',
      };

      const result = await s3Provider.listObjects(input);

      expect(result).toEqual(mockResponse);
      expect(result.Contents).toHaveLength(0);
    });

    test('should handle S3 client errors for listObjects', async () => {
      const s3Error = new Error('Bucket does not exist');
      s3Mock.on(ListObjectsV2Command).rejects(s3Error);

      const input = {
        Bucket: 'nonexistent-bucket',
      };

      await expect(s3Provider.listObjects(input)).rejects.toThrow('Bucket does not exist');
    });

    test('should handle pagination with continuation token', async () => {
      const mockResponse = {
        Contents: [{ Key: 'file1.txt', Size: 1024 }],
        IsTruncated: true,
        NextContinuationToken: 'next-token',
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(ListObjectsV2Command).resolves(mockResponse);

      const input = {
        Bucket: 'test-bucket',
        ContinuationToken: 'previous-token',
      };

      const result = await s3Provider.listObjects(input);

      expect(result).toEqual(mockResponse);
      expect(result.IsTruncated).toBe(true);
      expect(result.NextContinuationToken).toBe('next-token');
    });
  });

  describe('deleteObject', () => {
    test('should delete a single file successfully', async () => {
      const mockResponse = {
        $metadata: {
          httpStatusCode: 204,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(DeleteObjectCommand).resolves(mockResponse);

      const bucket = 'test-bucket';
      const key = 'file-to-delete.txt';

      await s3Provider.deleteObject(bucket, key);

      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
      const deleteCommand = s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input;
      expect(deleteCommand.Bucket).toBe(bucket);
      expect(deleteCommand.Key).toBe(key);
    });

    test('should handle delete errors', async () => {
      const s3Error = new Error('Delete failed');
      s3Mock.on(DeleteObjectCommand).rejects(s3Error);

      const bucket = 'test-bucket';
      const key = 'file-to-delete.txt';

      await expect(s3Provider.deleteObject(bucket, key)).rejects.toThrow('Delete failed');
    });

    test('should handle non-existent file deletion gracefully', async () => {
      // S3 returns success even when deleting non-existent objects
      const mockResponse = {
        $metadata: {
          httpStatusCode: 204,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(DeleteObjectCommand).resolves(mockResponse);

      const bucket = 'test-bucket';
      const key = 'non-existent-file.txt';

      await expect(s3Provider.deleteObject(bucket, key)).resolves.not.toThrow();
      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
    });
  });

  describe('deleteFilesInS3', () => {
    test('should delete multiple files successfully', async () => {
      const mockResponse = {
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(DeleteObjectsCommand).resolves(mockResponse);

      const bucket = 'test-bucket';
      const keys = ['file1.txt', 'file2.txt', 'file3.txt'];

      await s3Provider.deleteObjects(bucket, keys);

      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(1);
      const deleteCommand = s3Mock.commandCalls(DeleteObjectsCommand)[0].args[0].input;
      expect(deleteCommand.Bucket).toBe(bucket);
      expect(deleteCommand.Delete?.Objects).toHaveLength(3);
      expect(deleteCommand.Delete?.Objects?.[0].Key).toBe('file1.txt');
      expect(deleteCommand.Delete?.Objects?.[1].Key).toBe('file2.txt');
      expect(deleteCommand.Delete?.Objects?.[2].Key).toBe('file3.txt');
    });

    test('should handle large number of files by chunking', async () => {
      const mockResponse = {
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(DeleteObjectsCommand).resolves(mockResponse);

      const bucket = 'test-bucket';
      const keys = Array.from({ length: 2500 }, (_, i) => `file${i}.txt`);

      await s3Provider.deleteObjects(bucket, keys);

      // Should make 3 calls: 1000 + 1000 + 500
      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(3);
    });

    test('should handle empty keys array', async () => {
      const bucket = 'test-bucket';
      const keys: string[] = [];

      await s3Provider.deleteObjects(bucket, keys);

      // Should not make any calls
      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
    });
  });

  describe('putObject', () => {
    test('should put object successfully', async () => {
      const mockResponse = {
        ETag: '"test-etag"',
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(PutObjectCommand).resolves(mockResponse);

      const input = {
        Bucket: 'test-bucket',
        Key: 'test-file.txt',
        Body: 'test content',
        ContentType: 'text/plain',
      };

      const result = await s3Provider.putObject(input);

      expect(result).toEqual(mockResponse);
      expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(1);
      const putCommand = s3Mock.commandCalls(PutObjectCommand)[0].args[0].input;
      expect(putCommand.Bucket).toBe('test-bucket');
      expect(putCommand.Key).toBe('test-file.txt');
      expect(putCommand.Body).toBe('test content');
      expect(putCommand.ContentType).toBe('text/plain');
    });

    test('should put JSON object successfully', async () => {
      const mockResponse = {
        ETag: '"json-etag"',
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      s3Mock.on(PutObjectCommand).resolves(mockResponse);

      const input = {
        Bucket: 'test-bucket',
        Key: 'data.json',
        Body: JSON.stringify({ test: 'data' }),
        ContentType: 'application/json',
      };

      const result = await s3Provider.putObject(input);

      expect(result).toEqual(mockResponse);
      expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(1);
    });

    test('should handle put object error', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('Put object failed'));

      const input = {
        bucket: 'test-bucket',
        key: 'test-file.txt',
        body: 'test content',
        contentType: 'text/plain',
      };

      await expect(s3Provider.putObject(input)).rejects.toThrow('Put object failed');
    });
  });

  describe('deleteDirectory', () => {
    test('should return if no objects found', async () => {
      const listObjectsMock = vi.spyOn(s3Provider, 'listObjects').mockResolvedValue({
        Contents: [],
        $metadata: { httpStatusCode: 200 },
      } as any);
      const deleteObjectsMock = vi.spyOn(s3Provider, 'deleteObjects');
      await s3Provider.deleteDirectory('bucket', 'prefix/');
      expect(listObjectsMock).toHaveBeenCalledWith({ Bucket: 'bucket', Prefix: 'prefix/' });
      expect(deleteObjectsMock).not.toHaveBeenCalled();
    });

    test('should delete objects and not recurse if IsTruncated is false', async () => {
      const listObjectsMock = vi.spyOn(s3Provider, 'listObjects').mockResolvedValue({
        Contents: [{ Key: 'a' }, { Key: 'b' }],
        IsTruncated: false,
        $metadata: { httpStatusCode: 200 },
      } as any);
      const deleteObjectsMock = vi.spyOn(s3Provider, 'deleteObjects').mockResolvedValue(undefined);
      await s3Provider.deleteDirectory('bucket', 'prefix/');
      expect(deleteObjectsMock).toHaveBeenCalledWith('bucket', ['a', 'b']);
      expect(listObjectsMock).toHaveBeenCalledTimes(1);
    });

    test('should recursively call itself if IsTruncated is true', async () => {
      const listObjectsMock = vi
        .spyOn(s3Provider, 'listObjects')
        .mockResolvedValueOnce({
          Contents: [{ Key: 'a' }],
          IsTruncated: true,
          $metadata: { httpStatusCode: 200 },
        } as any)
        .mockResolvedValueOnce({
          Contents: [{ Key: 'b' }],
          IsTruncated: false,
          $metadata: { httpStatusCode: 200 },
        } as any);
      const deleteObjectsMock = vi.spyOn(s3Provider, 'deleteObjects').mockResolvedValue(undefined);
      await s3Provider.deleteDirectory('bucket', 'prefix/');
      expect(deleteObjectsMock).toHaveBeenCalledTimes(2);
      expect(listObjectsMock).toHaveBeenCalledTimes(2);
    });

    test('should throw on error', async () => {
      vi.spyOn(s3Provider, 'listObjects').mockRejectedValue(new Error('fail'));
      await expect(s3Provider.deleteDirectory('bucket', 'prefix/')).rejects.toThrow('fail');
    });
  });

  describe('getFileAsStream', () => {
    test('should return readable stream when body exists', async () => {
      const mockStream = { pipe: vi.fn() };
      s3Mock.on(GetObjectCommand).resolves({ Body: mockStream });

      const result = await s3Provider.getFileAsStream('test-bucket', 'test-key');

      expect(result).toBe(mockStream);
    });

    test('should throw NotFoundError when body is missing', async () => {
      s3Mock.on(GetObjectCommand).resolves({ Body: undefined });

      await expect(s3Provider.getFileAsStream('test-bucket', 'test-key')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('getFileAsBuffer', () => {
    test('should return buffer when body exists', async () => {
      const mockBody = {
        transformToByteArray: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      };
      s3Mock.on(GetObjectCommand).resolves({ Body: mockBody });

      const result = await s3Provider.getFileAsBuffer('test-bucket', 'test-key');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toEqual(Buffer.from([1, 2, 3]));
    });

    test('should throw NotFoundError when byte array is missing', async () => {
      const mockBody = {
        transformToByteArray: vi.fn().mockResolvedValue(undefined),
      };
      s3Mock.on(GetObjectCommand).resolves({ Body: mockBody });

      await expect(s3Provider.getFileAsBuffer('test-bucket', 'test-key')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('listObjects with getAllObjects', () => {
    test('should paginate until all objects are collected', async () => {
      s3Mock
        .on(ListObjectsV2Command)
        .resolvesOnce({
          Contents: [{ Key: 'a.txt' }],
          IsTruncated: true,
          NextContinuationToken: 'next',
        })
        .resolvesOnce({
          Contents: [{ Key: 'b.txt' }],
          IsTruncated: false,
        });

      const result = await s3Provider.listObjects({ Bucket: 'test-bucket' }, true);

      expect(result.Contents).toHaveLength(2);
      expect(s3Mock.commandCalls(ListObjectsV2Command)).toHaveLength(2);
    });
  });

  describe('multipartUpload', () => {
    test('should upload via multipart helper and return result', async () => {
      uploadDoneMock.mockResolvedValue({
        $metadata: { httpStatusCode: 200 },
      });

      const result = await s3Provider.multipartUpload({
        Bucket: 'test-bucket',
        Key: 'large-file.bin',
        Body: Buffer.from('data'),
      });

      expect(result.$metadata.httpStatusCode).toBe(200);
      expect(uploadDoneMock).toHaveBeenCalledOnce();
    });

    test('should throw BadRequestError when upload status is not 200', async () => {
      uploadDoneMock.mockResolvedValue({ $metadata: { httpStatusCode: 500 } });

      await expect(
        s3Provider.multipartUpload({
          Bucket: 'test-bucket',
          Key: 'large-file.bin',
          Body: Buffer.from('data'),
        }),
      ).rejects.toThrow('Failed to upload file.');
    });
  });
});
