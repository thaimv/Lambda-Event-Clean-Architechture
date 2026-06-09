import { ParquetFileDatasource } from '@common/datasources/parquet-file/implements/parquet-file.datasource.impl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock parquetjs
vi.mock('@dsnp/parquetjs', () => ({
  ParquetReader: {
    openBuffer: vi.fn(),
  },
}));

describe('ParquetFileDatasource', () => {
  let datasource: ParquetFileDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    datasource = new ParquetFileDatasource();
  });

  describe('readRecords', () => {
    it('should successfully read parquet records', async () => {
      const mockRecords = [
        { id: 1, name: 'test1' },
        { id: 2, name: 'test2' },
      ];

      const mockCursor = {
        next: vi
          .fn()
          .mockResolvedValueOnce(mockRecords[0])
          .mockResolvedValueOnce(mockRecords[1])
          .mockResolvedValueOnce(null),
      };

      const mockReader = {
        getCursor: vi.fn().mockReturnValue(mockCursor),
        close: vi.fn().mockResolvedValue(undefined),
      };

      const { ParquetReader } = await import('@dsnp/parquetjs');
      vi.mocked(ParquetReader.openBuffer).mockResolvedValue(mockReader);

      const buffer = Buffer.from('mock parquet data');
      const result = await datasource.readRecords(buffer);

      expect(result).toEqual(mockRecords);
      expect(ParquetReader.openBuffer).toHaveBeenCalledWith(buffer);
      expect(mockReader.getCursor).toHaveBeenCalled();
      expect(mockCursor.next).toHaveBeenCalledTimes(3);
      expect(mockReader.close).toHaveBeenCalled();
    });

    it('should handle empty parquet file', async () => {
      const mockCursor = {
        next: vi.fn().mockResolvedValueOnce(null),
      };

      const mockReader = {
        getCursor: vi.fn().mockReturnValue(mockCursor),
        close: vi.fn().mockResolvedValue(undefined),
      };

      const { ParquetReader } = await import('@dsnp/parquetjs');
      vi.mocked(ParquetReader.openBuffer).mockResolvedValue(mockReader);

      const buffer = Buffer.from('empty parquet data');
      const result = await datasource.readRecords(buffer);

      expect(result).toEqual([]);
      expect(ParquetReader.openBuffer).toHaveBeenCalledWith(buffer);
      expect(mockReader.getCursor).toHaveBeenCalled();
      expect(mockCursor.next).toHaveBeenCalledTimes(1);
      expect(mockReader.close).toHaveBeenCalled();
    });

    it('should handle parquet reader errors', async () => {
      const { ParquetReader } = await import('@dsnp/parquetjs');
      vi.mocked(ParquetReader.openBuffer).mockRejectedValue(new Error('Parquet read error'));

      const buffer = Buffer.from('invalid parquet data');
      await expect(datasource.readRecords(buffer)).rejects.toThrow('Parquet read error');
    });

    it('should handle cursor errors', async () => {
      const mockCursor = {
        next: vi.fn().mockRejectedValue(new Error('Cursor error')),
      };

      const mockReader = {
        getCursor: vi.fn().mockReturnValue(mockCursor),
        close: vi.fn().mockResolvedValue(undefined),
      };

      const { ParquetReader } = await import('@dsnp/parquetjs');
      vi.mocked(ParquetReader.openBuffer).mockResolvedValue(mockReader);

      const buffer = Buffer.from('parquet data');
      await expect(datasource.readRecords(buffer)).rejects.toThrow('Cursor error');
    });

    it('should handle reader close errors', async () => {
      const mockRecords = [{ id: 1, name: 'test' }];
      const mockCursor = {
        next: vi.fn().mockResolvedValueOnce(mockRecords[0]).mockResolvedValueOnce(null),
      };

      const mockReader = {
        getCursor: vi.fn().mockReturnValue(mockCursor),
        close: vi.fn().mockRejectedValue(new Error('Close error')),
      };

      const { ParquetReader } = await import('@dsnp/parquetjs');
      vi.mocked(ParquetReader.openBuffer).mockResolvedValue(mockReader);

      const buffer = Buffer.from('parquet data');
      await expect(datasource.readRecords(buffer)).rejects.toThrow('Close error');
    });
  });
});
