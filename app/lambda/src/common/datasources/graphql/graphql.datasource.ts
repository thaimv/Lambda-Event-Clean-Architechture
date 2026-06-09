import type { IdentityGraphQLInput } from '@common/types/datasources/graphql.type';

export interface IGraphQLDatasource {
  /**
   * Invoke GraphQL mutation
   * @param field - GraphQL field name
   * @param args - Arguments for the mutation
   * @param selectionSet - Fields to select from response
   * @param identity - Optional identity information for GraphQL context
   * @returns Promise<GraphQLData> - Mutation response data
   */
  invokeMutation(
    field: string,
    args: Record<string, unknown> | object,
    selectionSet: string[],
    identity?: IdentityGraphQLInput,
  ): Promise<unknown>;

  /**
   * Invoke GraphQL query
   * @param field - GraphQL field name
   * @param args - Arguments for the query
   * @param selectionSet - Fields to select from response
   * @param identity - Optional identity information for GraphQL context
   * @returns Promise<GraphQLData> - Query response data
   */
  invokeQuery(
    field: string,
    args: Record<string, unknown> | object,
    selectionSet: string[],
    identity?: IdentityGraphQLInput,
  ): Promise<unknown>;
}
