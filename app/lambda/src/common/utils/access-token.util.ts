import { COOKIE_CONST } from '@common/constants/app.const';
import { CookieUtil } from '@common/utils/cookie-util';

type HeaderSource = {
  headers?: Record<string, string | undefined> | null;
  multiValueHeaders?: Record<string, string[] | undefined> | null;
};

const matchesHeaderName = (key: string, names: string[]): boolean =>
  names.some((name) => key.toLowerCase() === name.toLowerCase());

const getRecordHeaderValue = (
  record: Record<string, string | undefined> | null | undefined,
  names: string[],
): string => {
  if (!record) {
    return '';
  }

  for (const name of names) {
    const direct = record[name];
    if (direct) {
      return direct;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (value && matchesHeaderName(key, names)) {
      return value;
    }
  }

  return '';
};

const getMultiValueHeaderValue = (
  record: Record<string, string[] | undefined> | null | undefined,
  names: string[],
): string => {
  if (!record) {
    return '';
  }

  for (const name of names) {
    const value = record[name]?.[0];
    if (value) {
      return value;
    }
  }

  for (const [key, values] of Object.entries(record)) {
    const value = values?.[0];
    if (value && matchesHeaderName(key, names)) {
      return value;
    }
  }

  return '';
};

const getHeaderValue = (source: HeaderSource, ...names: string[]): string => {
  const fromHeaders = getRecordHeaderValue(source.headers, names);
  if (fromHeaders) {
    return fromHeaders;
  }

  return getMultiValueHeaderValue(source.multiValueHeaders, names);
};

const getBearerToken = (authorization: string): string => {
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? '';
};

/**
 * Reads the Cognito access token from cookie or Authorization header.
 * API Gateway request authorizers only forward headers listed in identity sources.
 */
export const getAccessTokenFromRequest = (source: HeaderSource): string => {
  const cookie = getHeaderValue(source, 'cookie', 'Cookie');
  const tokenFromCookie = CookieUtil.getValue(cookie, COOKIE_CONST.ACCESS_TOKEN_NAME);
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  const authorization = getHeaderValue(source, 'authorization', 'Authorization');
  return getBearerToken(authorization);
};
