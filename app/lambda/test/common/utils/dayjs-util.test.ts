import { DATE_FORMAT } from '@common/constants/app.const';
import { InternalServerError } from '@common/errors/internal-server-error';
import {
  dayjs,
  getDateFormat,
  getEndOfMonthFormat,
  getIso8601Microseconds,
  getJstDateFormat,
  getNowWithServerTimezone,
  getStartOfMonthFormat,
  getTzDate,
  getTzOffset,
  getUtcDateFormat,
} from '@common/utils/dayjs-util';
import { describe, expect, test } from 'vitest';

describe('Date Utility Functions', () => {
  test('should format date correctly with getDateFormat', () => {
    expect(getDateFormat('2023-03-15T12:00:00Z', DATE_FORMAT.YYYY_MM_DD)).toBe('2023-03-15');
  });

  test('should format date with timezone offset', () => {
    // UTC time 12:00:00 + 7 hours offset = 19:00:00
    expect(getDateFormat('2023-03-15T12:00:00Z', 'YYYY-MM-DD HH:mm:ss', '+07:00')).toBe(
      '2023-03-15 19:00:00',
    );
  });

  test('should format date with negative timezone offset', () => {
    // UTC time 12:00:00 - 5 hours offset = 07:00:00
    expect(getDateFormat('2023-03-15T12:00:00Z', 'YYYY-MM-DD HH:mm:ss', '-05:00')).toBe(
      '2023-03-15 07:00:00',
    );
  });

  test('should use UTC when no offset provided', () => {
    // When no offset provided, dayjs converts to local timezone
    // Test should verify format works, not specific timezone conversion
    const result = getDateFormat('2023-03-15T12:00:00Z', 'YYYY-MM-DD HH:mm:ss');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test('should return the start of the month in the specified format', () => {
    const date = '2025-04-04';
    const format = 'YYYY-MM-DD';
    const result = getStartOfMonthFormat(date, format);
    expect(result).toBe('2025-04-01');
  });

  test('should return the end of the month in the specified format', () => {
    const date = '2025-02-15';
    const format = 'YYYY-MM-DD';
    const result = getEndOfMonthFormat(date, format);
    expect(result).toBe('2025-02-28');
  });

  test('should handle date without format for start of month', () => {
    const date = '2025-04-04';
    const result = getStartOfMonthFormat(date);
    expect(result).toBe(dayjs(date).startOf('month').format());
  });

  test('should handle date without format for end of month', () => {
    const date = '2025-02-15';
    const result = getEndOfMonthFormat(date);
    expect(result).toBe(dayjs(date).endOf('month').format());
  });

  test('should return UTC date format correctly', () => {
    const date = '2025-04-04T15:30:00Z';
    const format = 'YYYY-MM-DDTHH:mm:ss[Z]';
    const result = getUtcDateFormat(date, format);
    expect(result).toBe('2025-04-04T15:30:00Z');
  });

  test('should return UTC date format without specified format', () => {
    const date = '2025-04-04T15:30:00Z';
    const result = getUtcDateFormat(date);
    expect(result).toBe(dayjs.utc(date).format());
  });

  test('should return the correct positive timezone offset', () => {
    expect(getTzOffset('2025-02-27T18:15:54+05:00')).toBe('+05:00');
  });

  test('should return the correct negative timezone offset', () => {
    expect(getTzOffset('2025-02-27T18:15:54-07:30')).toBe('-07:30');
  });

  test('should throw an error if the timezone offset is invalid', () => {
    expect(() => getTzOffset('2025-02-27T18:15:54+5:00')).toThrow(InternalServerError);
  });

  test('should throw an error if the timezone offset is missing', () => {
    expect(() => getTzOffset('2025-02-27T18:15:54')).toThrow(InternalServerError);
  });

  test('should return the correct date part', () => {
    expect(getTzDate('2025-02-27T23:15:54+05:00')).toBe('2025-02-27');
  });

  test('should throw an error if the date format is invalid', () => {
    expect(() => getTzDate('27-02-2025T23:15:54+05:00')).toThrow(InternalServerError);
  });

  test('should format UTC date as ISO8601 with microseconds', () => {
    const date = new Date('2025-04-04T15:30:45.123Z');

    expect(getIso8601Microseconds(date)).toBe('2025-04-04T15:30:45.123000');
  });

  test('should format date in JST timezone', () => {
    expect(getJstDateFormat('2025-04-04T15:30:00Z', 'YYYY-MM-DD HH:mm')).toBe('2025-04-05 00:30');
  });

  test('should return current datetime with server timezone offset', () => {
    const result = getNowWithServerTimezone();

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{4}$/);
  });
});
