import type { QueryResultsInput, QueryResultsOutput } from '@common/types/datasources/athena.type';

export interface IAthenaDatasource {
  getQueryResults(input: QueryResultsInput): Promise<QueryResultsOutput>;
}
