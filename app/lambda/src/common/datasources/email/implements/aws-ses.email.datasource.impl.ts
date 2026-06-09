import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { DI } from '@common/constants/di.const';
import type { IEmailDatasource } from '@common/datasources/email/email.datasource';
import type { SendEmailInput, SendEmailOutput } from '@common/types/datasources/email.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

/**
 * AWS SES adapter for sending email.
 */
@injectable()
export class AwsSesEmailDatasource implements IEmailDatasource {
  private readonly client: SESClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new SESClient({ region: appConfig.awsConfig.region });
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
    const command = new SendEmailCommand(input);
    return this.client.send(command);
  }
}
