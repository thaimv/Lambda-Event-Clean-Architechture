import type { IParquetFileDatasource } from '@common/datasources/parquet-file/parquet-file.datasource';
import { ParquetReader } from '@dsnp/parquetjs';
import { injectable } from 'inversify';

/**
 * Datasource implementation for handling parquet file operations.
 */
@injectable()
export class ParquetFileDatasource implements IParquetFileDatasource {
  /**
   * Read parquet file from buffer and return all records
   * @param buffer - Parquet file buffer
   * @returns Promise resolving to array of records
   */
  async readRecords<T>(buffer: Buffer): Promise<T[]> {
    const reader = await ParquetReader.openBuffer(buffer);
    const cursor = reader.getCursor();
    const records: any[] = [];

    let record = await cursor.next();
    while (record) {
      records.push(record);
      record = await cursor.next();
    }

    await reader.close();

    return records;
  }
}
