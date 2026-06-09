import { LogItem } from '@aws-lambda-powertools/logger';
import { CustomLogFormatter, logger, primaryLogger } from '@common/logger';
import { describe, expect, test } from 'vitest';

describe('CustomLogFormatter', () => {
  test('formats log attributes with lambda request id', () => {
    const formatter = new CustomLogFormatter();
    const timestamp = new Date('2026-06-06T00:00:00.000Z');

    const logItem = formatter.formatAttributes(
      {
        logLevel: 'INFO',
        message: 'test message',
        timestamp,
        lambdaContext: { awsRequestId: 'req-123' },
      } as never,
      { customField: 'value' },
    );

    expect(logItem).toBeInstanceOf(LogItem);
    expect(logItem.getAttributes()).toMatchObject({
      logLevel: 'INFO',
      message: 'test message',
      lambdaRequestId: 'req-123',
      customField: 'value',
    });
  });
});

describe('logger exports', () => {
  test('exports configured logger instances', () => {
    expect(logger).toBeDefined();
    expect(primaryLogger).toBeDefined();
  });
});
