import { LogFormatter, Logger, LogItem } from '@aws-lambda-powertools/logger';
import type { LogAttributes, LogLevel } from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';
import type { UnformattedAttributes } from '@aws-lambda-powertools/logger/lib/cjs/types/logKeys';
import { CONST } from '@common/constants/app.const';
import { jsonReplacerFn } from '@common/utils/sensitive-data.util';

type CustomLog = LogAttributes;

export class CustomLogFormatter extends LogFormatter {
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes,
  ): LogItem {
    const baseAttributes: CustomLog = {
      logLevel: attributes.logLevel,
      timestamp: this.formatTimestamp(attributes.timestamp),
      message: attributes.message,
      lambdaRequestId: attributes.lambdaContext?.awsRequestId,
    };

    const logItem = new LogItem({ attributes: baseAttributes });
    logItem.addAttributes(additionalLogAttributes);

    return logItem;
  }
}

export const logger = new Logger({
  logFormatter: new CustomLogFormatter(),
  serviceName: CONST.SERVICE_NAME,
  logLevel: process.env.LOG_LEVEL as LogLevel,
  jsonReplacerFn,
});

export const primaryLogger = new Logger({
  logFormatter: new CustomLogFormatter(),
  serviceName: CONST.SERVICE_NAME,
  logLevel: 'TRACE',
  jsonReplacerFn,
});
