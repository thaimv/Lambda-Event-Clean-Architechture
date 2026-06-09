import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { LambdaDatasource } from '@common/datasources/lambda/implements/lambda.datasource.impl';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, test } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const lambdaMock = mockClient(LambdaClient);

describe('LambdaDatasource', () => {
  let datasource: LambdaDatasource;

  beforeEach(() => {
    lambdaMock.reset();
    datasource = new LambdaDatasource(createMockAppConfig({ region: 'eu-west-1' }));
  });

  test('invokes lambda with provided input', async () => {
    const input = {
      FunctionName: 'test-function',
      Payload: Buffer.from(JSON.stringify({ key: 'value' })),
    };
    const expectedOutput = {
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({ result: 'ok' })),
    };

    lambdaMock.on(InvokeCommand).resolves(expectedOutput);

    const result = await datasource.invoke(input);

    expect(result).toEqual(expectedOutput);
    expect(lambdaMock.commandCalls(InvokeCommand)[0].args[0].input).toEqual(input);
  });

  test('invokeLambdaAsync sends event invocation', async () => {
    lambdaMock.on(InvokeCommand).resolves({ StatusCode: 202 });

    await datasource.invokeLambdaAsync('async-function', { key: 'value' });

    expect(lambdaMock.commandCalls(InvokeCommand)[0].args[0].input).toEqual({
      FunctionName: 'async-function',
      InvocationType: 'Event',
      Payload: JSON.stringify({ key: 'value' }),
    });
  });

  test('invokeLambdaSync returns parsed payload', async () => {
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({ result: 'ok' })),
    });

    const result = await datasource.invokeLambdaSync<{ result: string }>('sync-function', {
      key: 'value',
    });

    expect(result).toEqual({ result: 'ok' });
  });

  test('invokeLambdaSync throws when lambda returns FunctionError', async () => {
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      FunctionError: 'Unhandled',
      Payload: Buffer.from(JSON.stringify({ error: 'failed' })),
    });

    await expect(datasource.invokeLambdaSync('sync-function', {})).rejects.toThrow(
      'Lambda function sync-function returned an error: Unhandled',
    );
  });

  test('invokeLambdaSync defaults empty payload to empty object', async () => {
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: undefined,
    });

    const result = await datasource.invokeLambdaSync<Record<string, never>>('sync-function', {});

    expect(result).toEqual({});
  });
});
