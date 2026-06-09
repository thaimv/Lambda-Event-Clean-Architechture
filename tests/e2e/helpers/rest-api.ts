import { Sha256 } from '@aws-crypto/sha256-js';
import type { AwsCredentials } from '@e2e/helpers/cognito-auth';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import axios, { type AxiosInstance } from 'axios';

export type RestApiConfig = {
  baseUrl: string;
  /** AWS credentials for SigV4 signing (service: execute-api). Omit for non-IAM endpoints. */
  credentials?: AwsCredentials;
  /** Additional auth headers (e.g. Cookie, Authorization). Omit for unauthenticated. */
  authHeaders?: Record<string, string>;
};

export type RestResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

export interface IRestApi {
  get<T = unknown>(path: string): Promise<RestResponse<T>>;
  post<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>>;
  put<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>>;
  patch<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>>;
  delete<T = unknown>(path: string): Promise<RestResponse<T>>;
}

export class RestApi implements IRestApi {
  private readonly client: AxiosInstance;
  private readonly signer?: SignatureV4;

  constructor(private readonly config: RestApiConfig) {
    this.client = axios.create({ baseURL: config.baseUrl, validateStatus: () => true });

    if (config.credentials) {
      this.signer = new SignatureV4({
        credentials: config.credentials,
        region: process.env.AWS_REGION ?? 'eu-west-2',
        service: 'execute-api',
        sha256: Sha256,
      });
    }
  }

  private async buildHeaders(
    method: string,
    path: string,
    body?: string,
  ): Promise<Record<string, string>> {
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.authHeaders,
    };

    if (!this.signer) return baseHeaders;

    const url = new URL(path, this.config.baseUrl);
    const httpRequest = new HttpRequest({
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { ...baseHeaders, host: url.hostname },
      body,
    });

    const signed = await this.signer.sign(httpRequest);
    return signed.headers as Record<string, string>;
  }

  async get<T = unknown>(path: string): Promise<RestResponse<T>> {
    const headers = await this.buildHeaders('GET', path);
    const res = await this.client.get<T>(path, { headers });
    return { statusCode: res.status, body: res.data };
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>> {
    const raw = JSON.stringify(body);
    const headers = await this.buildHeaders('POST', path, raw);
    const res = await this.client.post<T>(path, body, { headers });
    return { statusCode: res.status, body: res.data };
  }

  async put<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>> {
    const raw = JSON.stringify(body);
    const headers = await this.buildHeaders('PUT', path, raw);
    const res = await this.client.put<T>(path, body, { headers });
    return { statusCode: res.status, body: res.data };
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<RestResponse<T>> {
    const raw = JSON.stringify(body);
    const headers = await this.buildHeaders('PATCH', path, raw);
    const res = await this.client.patch<T>(path, body, { headers });
    return { statusCode: res.status, body: res.data };
  }

  async delete<T = unknown>(path: string): Promise<RestResponse<T>> {
    const headers = await this.buildHeaders('DELETE', path);
    const res = await this.client.delete<T>(path, { headers });
    return { statusCode: res.status, body: res.data };
  }
}
