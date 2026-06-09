import type {
  ImportTerminologyInput,
  ImportTerminologyOutput,
  TranslateTextInput,
  TranslateTextOutput,
} from '@common/types/datasources/translate.type';

export interface ITranslateDatasource {
  /**
   * Translate text.
   * @param input - The input for translating text.
   * @returns The translated text result.
   */
  translateText(input: TranslateTextInput): Promise<TranslateTextOutput>;
  /**
   * Import terminology.
   * @param input - The input for importing terminology.
   * @returns The import terminology result.
   */
  importTerminology(input: ImportTerminologyInput): Promise<ImportTerminologyOutput>;
}
