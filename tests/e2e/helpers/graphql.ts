import { Sha256 } from '@aws-crypto/sha256-js';
import type { AwsCredentials } from '@e2e/helpers/cognito-auth';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import axios from 'axios';

export type GraphQLResponse = {
  data?: Record<string, unknown>;
  errors?: Array<Record<string, unknown>>;
};

export interface IGraphQL {
  request(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse>;
}

export type GraphQLConfig = {
  endpoint: string;
  /** Omit for unauthenticated requests — SigV4 signing is skipped entirely. */
  credentials?: AwsCredentials;
};

export class GraphQL implements IGraphQL {
  private readonly signer?: SignatureV4;

  constructor(private readonly config: GraphQLConfig) {
    if (config.credentials) {
      this.signer = new SignatureV4({
        credentials: config.credentials,
        region: process.env.AWS_REGION ?? 'eu-west-2',
        service: 'appsync',
        sha256: Sha256,
      });
    }
  }

  async request(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse> {
    const url = new URL(this.config.endpoint);
    const body = JSON.stringify({ query, variables });

    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      host: url.hostname,
    };

    let requestHeaders = baseHeaders;

    if (this.signer) {
      const httpRequest = new HttpRequest({
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname,
        headers: baseHeaders,
        body,
      });
      const signed = await this.signer.sign(httpRequest);
      requestHeaders = signed.headers as Record<string, string>;
    }

    const response = await axios.post(this.config.endpoint, body, {
      headers: requestHeaders,
      validateStatus: () => true,
    });

    return response.data;
  }
}
