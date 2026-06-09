import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { AwsSesEmailDatasource } from '@common/datasources/email/implements/aws-ses.email.datasource.impl';
import type { SendEmailInput } from '@common/types/datasources/email.type';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const sesMock = mockClient(SESClient);

describe('AwsSesEmailDatasource', () => {
  let emailDatasource: AwsSesEmailDatasource;

  beforeEach(() => {
    sesMock.reset();
    emailDatasource = new AwsSesEmailDatasource(createMockAppConfig());
    vi.clearAllMocks();
  });

  test('should create default SESClient when client is not provided', () => {
    const datasource = new AwsSesEmailDatasource(createMockAppConfig());
    expect(datasource).toBeInstanceOf(AwsSesEmailDatasource);
  });

  describe('sendEmail', () => {
    test('should successfully send email', async () => {
      const input: SendEmailInput = {
        Source: 'sender@example.com',
        Destination: {
          ToAddresses: ['recipient@example.com'],
        },
        Message: {
          Subject: { Data: 'Test Subject', Charset: 'UTF-8' },
          Body: {
            Html: { Data: '<h1>Test Body</h1>', Charset: 'UTF-8' },
          },
        },
      };

      const expectedOutput = {
        MessageId: 'test-message-id',
      };

      sesMock.on(SendEmailCommand).resolves(expectedOutput);

      const result = await emailDatasource.sendEmail(input);

      expect(result).toEqual(expectedOutput);
      expect(sesMock.commandCalls(SendEmailCommand)[0].args[0].input).toEqual(input);
    });
  });
});
