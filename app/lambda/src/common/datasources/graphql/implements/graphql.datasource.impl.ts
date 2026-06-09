import { DI } from '@common/constants/di.const';
import type { IGraphQLDatasource } from '@common/datasources/graphql/graphql.datasource';
import type { ILambdaDatasource } from '@common/datasources/lambda/lambda.datasource';
import { logger } from '@common/logger';
import type {
  GraphQLLambdaResponse,
  GraphQLResponsePayload,
  IdentityGraphQLInput,
} from '@common/types/datasources/graphql.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class GraphQLDatasource implements IGraphQLDatasource {
  constructor(
    @inject(DI.LAMBDA_DATASOURCE)
    private readonly lambdaDatasource: ILambdaDatasource,
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  /**
   * Generic GraphQL invocation method
   * @param field - GraphQL field name
   * @param args - Arguments for the GraphQL operation
   * @param selectionSet - Fields to select from response
   * @param parentTypeName - GraphQL parent type (Query/Mutation)
   * @param identity - Optional identity information for GraphQL context
   * @returns Promise<unknown> - GraphQL response data
   */
  private async invokeGraphQL(
    field: string,
    args: Record<string, unknown> | object,
    selectionSet: string[],
    parentTypeName: 'Query' | 'Mutation',
    identity?: IdentityGraphQLInput,
  ): Promise<unknown> {
    const graphqlLambdaArn = this.appConfig.lambdaConfig.graphqlApiArn;

    const payload = {
      field,
      arguments: args,
      source: null,
      parentTypeName,
      variables: {},
      selectionSetList: selectionSet,
      selectionSetGraphQL: `{ ${selectionSet.join(' ')} }`,
      identity: {
        cognitoIdentityAuthProvider: identity?.cognitoIdentityAuthProvider || '',
        username: identity?.username || '',
      },
      request: {
        headers: {
          'x-amzn-requestid': `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          'content-type': 'application/json',
          'user-agent': '',
        },
      },
    };

    logger.info(`Preparing to invoke GraphQL Lambda for ${parentTypeName.toLowerCase()}`, {
      graphqlLambdaArn,
      field,
      args,
    });

    const result = await this.lambdaDatasource.invoke({
      FunctionName: graphqlLambdaArn,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    });

    logger.info('GraphQL Lambda invoked', { result });

    return this.handleGraphqlLambdaResponse({
      StatusCode: result.StatusCode ?? 500,
      Payload: result.Payload,
    });
  }

  /**
   * Invoke GraphQL mutation
   */
  async invokeMutation(
    field: string,
    args: Record<string, unknown> | object,
    selectionSet: string[],
    identity?: IdentityGraphQLInput,
  ): Promise<unknown> {
    return await this.invokeGraphQL(field, args, selectionSet, 'Mutation', identity);
  }

  /**
   * Invoke GraphQL query
   */
  async invokeQuery(
    field: string,
    args: Record<string, unknown> | object,
    selectionSet: string[],
    identity?: IdentityGraphQLInput,
  ): Promise<unknown> {
    return await this.invokeGraphQL(field, args, selectionSet, 'Query', identity);
  }

  /**
   * Handle response from GraphQL Lambda
   * @param result - Result from the Lambda invocation
   */
  private async handleGraphqlLambdaResponse(result: GraphQLLambdaResponse): Promise<unknown> {
    // Handle Lambda invocation response
    if (result.StatusCode !== 200) {
      throw new Error(`GraphQL Lambda invocation failed with status code: ${result.StatusCode}`);
    }

    // Parse the response payload
    if (!result.Payload) {
      throw new Error('GraphQL Lambda returned empty payload');
    }

    const payloadString = Buffer.from(result.Payload as Uint8Array).toString('utf-8');
    let responsePayload: GraphQLResponsePayload;
    try {
      responsePayload = JSON.parse(payloadString) as GraphQLResponsePayload;
    } catch {
      throw new Error('Invalid response from GraphQL Lambda');
    }
    logger.debug('GraphQL Lambda response parsed', { responsePayload });

    // Check for GraphQL errors
    if (responsePayload.errors && responsePayload.errors.length > 0) {
      throw new Error(`GraphQL errors: ${responsePayload.errors.map((e) => e.message).join(', ')}`);
    }

    // Return the data (could be query result or mutation result)
    return responsePayload;
  }
}
