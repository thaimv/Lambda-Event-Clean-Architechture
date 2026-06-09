import { ERROR_MESSAGE } from '@common/constants/response.const';
import { ValidationError } from '@common/errors/validation-error';
import { parseCsv, parseCSV } from '@common/utils/csv-util';
import { describe, expect, it } from 'vitest';

describe('CSV Utility Functions', () => {
  describe('parseCsv', () => {
    it('should parse CSV with basic data', () => {
      const csvString = 'name,age\nJohn,25\nJane,30';
      const result = parseCsv(csvString, 0);

      expect(result).toEqual([
        ['name', 'age'],
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' },
      ]);
    });

    it('should handle empty CSV', () => {
      const csvString = '';
      expect(() => parseCsv(csvString, 0)).toThrow(ValidationError);
      expect(() => parseCsv(csvString, 0)).toThrow(ERROR_MESSAGE.NO_DATA_FOUND_IN_CSV);
    });

    it('should parse CSV with only headers and no data', () => {
      const csvString = 'name,age\n';
      const result = parseCsv(csvString, 0);
      expect(result).toEqual([['name', 'age']]);
    });

    it('should throw when lineSkip leaves no data rows', () => {
      const csvString = 'name,age';

      expect(() => parseCsv(csvString, 1)).toThrow(ValidationError);
      expect(() => parseCsv(csvString, 1)).toThrow(ERROR_MESSAGE.NO_DATA_FOUND_IN_CSV);
    });

    it('should default missing column values to empty string', () => {
      const csvString = 'name,age,city\nJohn,25';
      const result = parseCsv(csvString, 0);

      expect(result).toEqual([['name', 'age', 'city'], { name: 'John', age: '25', city: '' }]);
    });
  });

  describe('parseCSV', () => {
    it('should parse CSV with basic data', async () => {
      const csvContent = 'name,age\nJohn,25\nJane,30';
      const result = await parseCSV(csvContent);

      expect(result).toEqual([
        { name: 'John', age: '25' },
        { name: 'Jane', age: '30' },
      ]);
    });

    it('should parse CSV with NULL values and convert them to null', async () => {
      const csvContent =
        'id,name,email,phone\n1,John,NULL,123-456\n2,Jane,jane@example.com,NULL\n3,Bob,NULL,NULL';
      const result = await parseCSV(csvContent);

      expect(result).toEqual([
        { id: '1', name: 'John', email: null, phone: '123-456' },
        { id: '2', name: 'Jane', email: 'jane@example.com', phone: null },
        { id: '3', name: 'Bob', email: null, phone: null },
      ]);
    });

    it('should parse CSV with mixed NULL values across columns', async () => {
      const csvContent = `id,label,image_path,logo_path,active_date
1,Item A,images/a.png,logos/a.png,2025-04-17
2,Item B,images/b.png,NULL,2025-04-17
3,Item C,NULL,logos/c.png,NULL
4,Item D,NULL,NULL,NULL
5,Item E,NULL,NULL,2025-05-01
6,Item F,NULL,NULL,NULL`;

      const result = await parseCSV(csvContent);

      expect(result).toEqual([
        {
          id: '1',
          label: 'Item A',
          image_path: 'images/a.png',
          logo_path: 'logos/a.png',
          active_date: '2025-04-17',
        },
        {
          id: '2',
          label: 'Item B',
          image_path: 'images/b.png',
          logo_path: null,
          active_date: '2025-04-17',
        },
        {
          id: '3',
          label: 'Item C',
          image_path: null,
          logo_path: 'logos/c.png',
          active_date: null,
        },
        {
          id: '4',
          label: 'Item D',
          image_path: null,
          logo_path: null,
          active_date: null,
        },
        {
          id: '5',
          label: 'Item E',
          image_path: null,
          logo_path: null,
          active_date: '2025-05-01',
        },
        {
          id: '6',
          label: 'Item F',
          image_path: null,
          logo_path: null,
          active_date: null,
        },
      ]);
    });

    it('should handle empty CSV content', async () => {
      const csvContent = '';
      const result = await parseCSV(csvContent);

      expect(result).toEqual([]);
    });

    it('should handle CSV with only headers', async () => {
      const csvContent = 'name,age\n';
      const result = await parseCSV(csvContent);

      expect(result).toEqual([]);
    });
  });
});
