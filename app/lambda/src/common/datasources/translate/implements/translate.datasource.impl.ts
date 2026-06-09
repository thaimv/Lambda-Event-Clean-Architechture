import {
  ImportTerminologyCommand,
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate';
import { DI } from '@common/constants/di.const';
import type { ITranslateDatasource } from '@common/datasources/translate/translate.datasource';
import type {
  ImportTerminologyInput,
  ImportTerminologyOutput,
  TranslateTextInput,
  TranslateTextOutput,
} from '@common/types/datasources/translate.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class TranslateDatasource implements ITranslateDatasource {
  private readonly client: TranslateClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new TranslateClient({
      region: appConfig.awsConfig.region,
      maxAttempts: 10,
    });
  }

  async translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
    return this.client.send(
      new TranslateTextCommand(input as ConstructorParameters<typeof TranslateTextCommand>[0]),
    );
  }

  async importTerminology(input: ImportTerminologyInput): Promise<ImportTerminologyOutput> {
    return this.client.send(
      new ImportTerminologyCommand(
        input as ConstructorParameters<typeof ImportTerminologyCommand>[0],
      ),
    );
  }
}
