import type { DatabaseSession } from '@common/types/datasources/database.type';

export interface ITransactionRunnerDatasource {
  runInTransaction<T>(callback: (tx: DatabaseSession) => Promise<T>): Promise<T>;
}
