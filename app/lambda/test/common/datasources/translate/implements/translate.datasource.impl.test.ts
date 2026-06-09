import {
  ImportTerminologyCommand,
  TranslateClient,
  TranslateTextCommand,
} from '@aws-sdk/client-translate';
import { TranslateDatasource } from '@common/datasources/translate/implements/translate.datasource.impl';
import type {
  ImportTerminologyInput,
  TranslateTextInput,
} from '@common/types/datasources/translate.type';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const translateMock = mockClient(TranslateClient);

describe('TranslateDatasource Provider', () => {
  let translateProvider: TranslateDatasource;

  beforeEach(() => {
    translateMock.reset();
    translateProvider = new TranslateDatasource(createMockAppConfig());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should create default TranslateClient when client is not provided', () => {
    const provider = new TranslateDatasource(createMockAppConfig());
    expect(provider).toBeInstanceOf(TranslateDatasource);
  });

  describe('translateText', () => {
    test('should successfully translate text', async () => {
      const input: TranslateTextInput = {
        Text: 'Hello, world!',
        SourceLanguageCode: 'en',
        TargetLanguageCode: 'es',
      };

      const expectedOutput = {
        TranslatedText: 'Hola, mundo!',
        SourceLanguageCode: 'en',
        TargetLanguageCode: 'es',
      };

      translateMock.on(TranslateTextCommand).resolves(expectedOutput);

      const result = await translateProvider.translateText(input);

      expect(result).toEqual(expectedOutput);
      expect(translateMock.commandCalls(TranslateTextCommand)[0].args[0].input).toEqual(input);
    });
  });

  describe('importTerminology', () => {
    test('should successfully import terminology', async () => {
      const input: ImportTerminologyInput = {
        Name: 'my-terminology',
        MergeStrategy: 'OVERWRITE',
        TerminologyData: {
          File: new Uint8Array([1, 2, 3, 4]),
          Format: 'CSV',
        },
      };

      const expectedOutput = {
        TerminologyProperties: { Name: 'my-terminology' },
      };

      translateMock.on(ImportTerminologyCommand).resolves(expectedOutput);

      const result = await translateProvider.importTerminology(input);

      expect(result).toEqual(expectedOutput);
      expect(translateMock.commandCalls(ImportTerminologyCommand)[0].args[0].input).toEqual(input);
    });
  });
});
