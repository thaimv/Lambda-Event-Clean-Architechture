import { AthenaClient, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { AthenaDatasource } from '@common/datasources/athena/implements/athena.datasource.impl';
import type { QueryResultsInput } from '@common/types/datasources/athena.type';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const athenaMock = mockClient(AthenaClient);

describe('AthenaDatasource datasource', () => {
  beforeEach(() => {
    athenaMock.reset();
  });

  it('should call AthenaDatasource client with GetQueryResultsCommand', async () => {
    athenaMock.on(GetQueryResultsCommand).resolves({ ResultSet: { Rows: [] } });
    const datasource = new AthenaDatasource(createMockAppConfig());

    const input: QueryResultsInput = {
      QueryExecutionId: 'exec-1',
    };

    const result = await datasource.getQueryResults(input);

    expect(result).toEqual({ ResultSet: { Rows: [] } });
    expect(athenaMock.commandCalls(GetQueryResultsCommand)).toHaveLength(1);
    expect(athenaMock.commandCalls(GetQueryResultsCommand)[0].args[0].input).toEqual(input);
  });

  it('should create default AthenaClient when constructed', () => {
    const datasource = new AthenaDatasource(createMockAppConfig());
    expect(datasource).toBeInstanceOf(AthenaDatasource);
  });
});
