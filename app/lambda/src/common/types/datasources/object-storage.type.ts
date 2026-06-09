import type { Readable } from 'stream';

export type ListObjectsInput = {
  Bucket: string;
  Prefix?: string;
  ContinuationToken?: string;
  MaxKeys?: number;
  Delimiter?: string;
};

export type ObjectSummary = {
  Key?: string;
  Size?: number;
  LastModified?: Date;
};

export type ListObjectsOutput = {
  Contents?: ObjectSummary[];
  IsTruncated?: boolean;
  NextContinuationToken?: string;
  $metadata?: unknown;
};

export type PutObjectInput = {
  Bucket: string;
  Key: string;
  Body?: Buffer | Readable | string;
  ContentType?: string;
  Metadata?: Record<string, string>;
  ACL?: string;
  ServerSideEncryption?: string;
  $metadata?: unknown;
};

export type PutObjectOutput = {
  ETag?: string;
};

export type AssumeRoleOutput = {
  Credentials?: {
    AccessKeyId?: string;
    SecretAccessKey?: string;
    SessionToken?: string;
    Expiration?: Date;
  };
};

export type ObjectStorageCrossAccountConfig = {
  roleArn?: string;
  region?: string;
  sessionName?: string;
};

export type AssumedRoleCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
};
