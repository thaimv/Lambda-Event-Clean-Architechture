import type { DatabaseClient } from '@common/types/datasources/database.type';

export interface IDBClientDatasource {
  getClient(): Promise<DatabaseClient>;
}
