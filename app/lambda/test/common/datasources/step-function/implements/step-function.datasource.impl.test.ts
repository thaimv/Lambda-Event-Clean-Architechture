import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { StepFunctionDatasource } from '@common/datasources/step-function/implements/step-function.datasource.impl';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const sfnMock = mockClient(SFNClient);

describe('StepFunctionDatasource Provider', () => {
  let stepFunctionProvider: StepFunctionDatasource;
  let mockSFNClient: SFNClient;

  beforeEach(() => {
    sfnMock.reset();
    mockSFNClient = new SFNClient({});
    stepFunctionProvider = new StepFunctionDatasource(createMockAppConfig());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create StepFunctionDatasource instance', () => {
      const stepFunction = new StepFunctionDatasource(createMockAppConfig());

      expect(stepFunction).toBeInstanceOf(StepFunctionDatasource);
    });
  });

  describe('startExecution', () => {
    test('should successfully start Step Functions execution', async () => {
      const input = {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
        input: JSON.stringify({ test: 'payload' }),
      };

      const expectedOutput = {
        executionArn:
          'arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:execution-123',
        startDate: new Date(),
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      sfnMock.on(StartExecutionCommand).resolves(expectedOutput);

      const result = await stepFunctionProvider.startExecution(input);

      expect(result).toEqual(expectedOutput);
      expect(sfnMock.commandCalls(StartExecutionCommand)).toHaveLength(1);
      expect(sfnMock.commandCalls(StartExecutionCommand)[0].args[0].input).toEqual(input);
    });

    test('should start execution with name parameter', async () => {
      const input = {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
        name: 'my-execution-name',
        input: JSON.stringify({ key: 'value' }),
      };

      const expectedOutput = {
        executionArn:
          'arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:my-execution-name',
        startDate: new Date(),
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      sfnMock.on(StartExecutionCommand).resolves(expectedOutput);

      const result = await stepFunctionProvider.startExecution(input);

      expect(result).toEqual(expectedOutput);
      expect(sfnMock.commandCalls(StartExecutionCommand)).toHaveLength(1);
    });

    test('should start execution with trace header', async () => {
      const input = {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
        input: JSON.stringify({ data: 'test' }),
        traceHeader: 'trace-header-value',
      };

      const expectedOutput = {
        executionArn:
          'arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:execution-456',
        startDate: new Date(),
        $metadata: {
          httpStatusCode: 200,
          requestId: 'test-request-id',
        },
      };

      sfnMock.on(StartExecutionCommand).resolves(expectedOutput);

      const result = await stepFunctionProvider.startExecution(input);

      expect(result).toEqual(expectedOutput);
      expect(sfnMock.commandCalls(StartExecutionCommand)).toHaveLength(1);
    });

    test('should throw an error if Step Functions client fails', async () => {
      const input = {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
        input: JSON.stringify({ test: 'payload' }),
      };

      const error = new Error('Step Functions Error: State machine not found');
      sfnMock.on(StartExecutionCommand).rejects(error);

      await expect(stepFunctionProvider.startExecution(input)).rejects.toThrow(error);
    });

    test('should handle Step Functions service errors', async () => {
      const input = {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:InvalidStateMachine',
        input: JSON.stringify({ test: 'payload' }),
      };

      const error = new Error('Service error: Execution limit exceeded');
      sfnMock.on(StartExecutionCommand).rejects(error);

      await expect(stepFunctionProvider.startExecution(input)).rejects.toThrow(
        'Execution limit exceeded',
      );
    });

    test('should handle invalid input JSON', async () => {
      const input = {
        stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
        input: 'invalid-json',
      };

      const error = new Error('Invalid input JSON');
      sfnMock.on(StartExecutionCommand).rejects(error);

      await expect(stepFunctionProvider.startExecution(input)).rejects.toThrow(
        'Invalid input JSON',
      );
    });
  });
});
