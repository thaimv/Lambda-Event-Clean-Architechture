import { DATE_FORMAT, REGEX } from '@common/constants/app.const';
import { ERROR_MESSAGE } from '@common/constants/response.const';
import { InternalServerError } from '@common/errors/internal-server-error';
import type { ConfigType } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Common
export const getDateFormat = (date: ConfigType, format?: string, tzOffset?: string) => {
  if (tzOffset) {
    // Handle timezone offset like "+07:00" or "-05:00"
    return dayjs(date).utcOffset(tzOffset).format(format);
  }
  // Keep timezone from input by not forcing UTC conversion
  return dayjs(date).format(format);
};

export const getStartOfMonthFormat = (date: ConfigType, format?: string) => {
  return dayjs(date).startOf('month').format(format);
};

export const getEndOfMonthFormat = (date: ConfigType, format?: string) => {
  return dayjs(date).endOf('month').format(format);
};

export const getIso8601Microseconds = (date: Date): string => {
  const d = dayjs(date).utc();
  const micros = String(d.millisecond() * 1000).padStart(6, '0');
  return `${d.format('YYYY-MM-DDTHH:mm:ss')}.${micros}`;
};

// Utc Time
export const getUtcDateFormat = (date: ConfigType, format?: string) => {
  return dayjs.utc(date).format(format);
};

// JST Time
export const getJstDateFormat = (date: ConfigType, format?: string) => {
  return dayjs(date).tz('Asia/Tokyo').format(format);
};

// Timezone

/**
 * Extracts and returns the timezone offset from a given date-time string.
 *
 * The function expects the date string to end with a valid timezone offset in the format "+HH:MM" or "-HH:MM".
 * If the offset is invalid, it throws an InternalServerError with a corresponding error message.
 *
 * @param {string} date - The date-time string to extract the timezone offset from (e.g., "2025-02-27T18:15:54+05:00").
 * @returns {string} - The extracted timezone offset (e.g., "+05:00").
 * @throws {InternalServerError} - If the extracted offset is invalid.
 *
 * @example
 * getTimezoneOffset("2025-02-27T18:15:54+05:00"); // returns "+05:00"
 * getTimezoneOffset("2025-02-27T18:15:54-07:30"); // returns "-07:30"
 * getTimezoneOffset("2025-02-27T18:15:54");       // throws InternalServerError
 */
export const getTzOffset = (date: string): string => {
  const offset = date.slice(-6);

  if (!REGEX.TIMEZONE_OFFSET.test(offset)) {
    throw new InternalServerError(ERROR_MESSAGE.INVALID_TIMEZONE_OFFSET);
  }

  return offset;
};

/**
 * Extracts the date part from a date-time string with timezone information.
 *
 * @param {string} date - The date-time string in the format "YYYY-MM-DDTHH:mm:ss+/-HH:MM" (e.g., "2025-02-27T23:15:54+05:00").
 * @returns {string} - The date part of the input string (e.g., "2025-02-27").
 */
export const getTzDate = (date: string): string => {
  const tzDate = date.split('T')[0];

  if (!dayjs(tzDate, DATE_FORMAT.YYYY_MM_DD, true).isValid()) {
    throw new InternalServerError(
      ERROR_MESSAGE.INVALID_DATE_FORMAT.replace('<date_format>', DATE_FORMAT.YYYY_MM_DD),
    );
  }

  return tzDate;
};

/**
 * Returns the current server date-time formatted for AthenaDatasource CSV output.
 *
 * The function uses the server's **local timezone** (where the Node.js process
 * is running) and produces a timestamp in the format:
 *
 *    "YYYY-MM-DD HH:mm:ss.SSS +/-HHMM"
 *
 * Examples:
 *   - If server is in GMT+7 => "2025-11-20 10:15:42.083 +0700"
 *   - If server is in GMT-5 => "2025-11-20 23:15:42.083 -0500"
 *
 * Notes:
 *   - The timezone offset is taken directly from the server environment.
 *   - Dayjs `Z` outputs "+07:00" => this function converts it to "+0700".
 *   - Useful when generating timestamps for CTAS, logs, or metadata fields
 *     that must reflect the server's true timezone.
 *
 * @returns {string} Formatted current date-time with server timezone offset.
 */
export const getNowWithServerTimezone = () => {
  const d = dayjs(); // server local timezone

  // Format offset: "+07:00" => "+0700"
  const offset = d.format('Z').replace(':', '');

  return `${d.format('YYYY-MM-DD HH:mm:ss.SSS')} ${offset}`;
};

export { dayjs };
