import type { GetSecretInput } from '@common/types/datasources/secrets-manager.type';

/**
 * Interface for AWS Secrets Manager datasource.
 * Generic over the secret value type to support different secret schemas.
 */
export interface ISecretsManagerDatasource {
  /**
   * Retrieves and parses a JSON secret value from AWS Secrets Manager.
   * @param input - GetSecretInput including the SecretId
   * @returns Parsed secret value cast to T
   * @throws SecretsNotFoundError when neither SecretString nor SecretBinary is present
   */
  getSecretValue<T>(input: GetSecretInput): Promise<T>;
}
