import { Readable } from 'stream';

import { ERROR_MESSAGE } from '@common/constants/response.const';
import { ValidationError } from '@common/errors/validation-error';
import { parse } from 'csv-parse';

/**
 * Helper function to parse CSV strings
 */
export const parseCsv = (csvString: string, lineSkip: number): any[] => {
  // Check if csvString is undefined, null, or empty
  if (!csvString || csvString.trim() === '') {
    throw new ValidationError(ERROR_MESSAGE.NO_DATA_FOUND_IN_CSV);
  }

  const lines = csvString.split('\n').filter((line) => line.trim());

  // Check if there are enough lines in the CSV after filtering
  if (lines.length <= lineSkip) {
    throw new ValidationError(ERROR_MESSAGE.NO_DATA_FOUND_IN_CSV);
  }
  const headers = lines[lineSkip++].split(',').map((header) => header.trim());

  const records = lines.slice(lineSkip).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const record: Record<string, any> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      record[header] = value;
    });

    return record;
  });

  return [headers, ...records];
};

/**
 * Parses a CSV string into an array of records.
 *
 * @template T - The type of the records in the resulting array.
 * @param {string} csvContent - The CSV content to be parsed.
 * @returns {Promise<T[]>} A promise that resolves to an array of parsed records.
 *
 * The function processes the CSV content using a stream, handling the data,
 * and errors which might occur during parsing.
 */
export const parseCSV = async <T>(csvContent: string): Promise<T[]> => {
  const results: T[] = [];

  const stream = Readable.from([csvContent]);
  const parser = stream.pipe(
    parse({
      delimiter: ',',
      from_line: 1,
      quote: '"',
      escape: '\\',
      raw: true,
      columns: (headers) => {
        return headers.map((header: string) => header.trim());
      },
      skip_empty_lines: true,
    }),
  );

  for await (const row of parser) {
    const normalizedRow: Record<string, any> = {};
    const record = row.record as Record<string, any>;
    const rawLine = row.raw as string;

    for (const key in record) {
      const value = record[key];

      // Check if this field was quoted in raw CSV line
      // by looking for "value" pattern
      const isQuoted = rawLine.includes(`"${value}"`);

      // NULL unquoted => convert to null
      // "NULL" quoted => keep as string
      normalizedRow[key] = !isQuoted && value === 'NULL' ? null : value;
    }
    results.push(normalizedRow as T);
  }
  return results;
};
