import type { GraphQLResponse, IGraphQL } from '@e2e/helpers/graphql';
import type { IRestApi, RestResponse } from '@e2e/helpers/rest-api';
import type { ISensitiveLeakDetector } from '@e2e/helpers/sensitive-leak-detector';

export interface IRequester {
  sendGraphQL(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse>;
  sendRest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<RestResponse<T>>;
}

export class Requester implements IRequester {
  constructor(
    readonly graphql: IGraphQL,
    readonly rest: IRestApi,
    readonly detector: ISensitiveLeakDetector,
  ) {}

  async bootstrap(): Promise<void> {}

  /**
   * Executes a GraphQL query/mutation and auto-scans both request variables and response data
   * for any key matching SENSITIVE_FIELDS. Each match is pushed to the detector so the
   * afterAll assertion can verify raw values never appear in CloudWatch logs.
   */
  async sendGraphQL(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse> {
    const result = await this.graphql.request(query, variables);

    if (variables) this.detector.scan(variables);
    this.detector.scan(result.data);

    return result;
  }

  /**
   * Executes an HTTP request against the REST API Gateway endpoint and auto-scans
   * the response body for sensitive fields.
   */
  async sendRest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<RestResponse<T>> {
    const result = await this.rest[
      method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'
    ]<T>(path, body as never);
    this.detector.scan(result.body);
    return result;
  }
}
