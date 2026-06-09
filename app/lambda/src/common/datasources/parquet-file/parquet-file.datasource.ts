export interface IParquetFileDatasource {
  /**
   * Read parquet file from buffer and return all records
   * @param buffer - Parquet file buffer
   * @returns Promise resolving to array of records
   */
  readRecords<T>(buffer: Buffer): Promise<T[]>;
}
