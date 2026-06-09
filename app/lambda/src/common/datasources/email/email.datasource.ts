import type { SendEmailInput, SendEmailOutput } from '@common/types/datasources/email.type';

/**
 * Port for sending email messages.
 * Vendor-specific details (e.g. AWS SES) are encapsulated in implementations.
 */
export interface IEmailDatasource {
  sendEmail(input: SendEmailInput): Promise<SendEmailOutput>;
}
