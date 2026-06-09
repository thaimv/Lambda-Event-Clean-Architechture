import { getAccessTokenFromRequest } from '@common/utils/access-token.util';
import { describe, expect, it } from 'vitest';

const token = 'jwtTest.eyJzdWIiOiJ1c2VySWQifQ.jwtSign';

describe('getAccessTokenFromRequest', () => {
  it('reads token from cookie header', () => {
    const result = getAccessTokenFromRequest({
      headers: { cookie: `project_access_token=${token}` },
    });

    expect(result).toBe(token);
  });

  it('reads token from Cookie header with capital C', () => {
    const result = getAccessTokenFromRequest({
      headers: { Cookie: `project_access_token=${token}` },
    });

    expect(result).toBe(token);
  });

  it('reads token from multiValueHeaders cookie arrays', () => {
    const result = getAccessTokenFromRequest({
      multiValueHeaders: { cookie: [`project_access_token=${token}`] },
    });

    expect(result).toBe(token);
  });

  it('reads token from Authorization bearer header', () => {
    const result = getAccessTokenFromRequest({
      headers: { authorization: `Bearer ${token}` },
    });

    expect(result).toBe(token);
  });

  it('reads token from cookie header with case-insensitive key', () => {
    const result = getAccessTokenFromRequest({
      headers: { COOKIE: `project_access_token=${token}` },
    });

    expect(result).toBe(token);
  });

  it('reads token from Authorization bearer header with case-insensitive key', () => {
    const result = getAccessTokenFromRequest({
      headers: { AUTHORIZATION: `Bearer ${token}` },
    });

    expect(result).toBe(token);
  });

  it('reads token from multiValueHeaders with case-insensitive key', () => {
    const result = getAccessTokenFromRequest({
      multiValueHeaders: { AUTHORIZATION: [`Bearer ${token}`] },
    });

    expect(result).toBe(token);
  });

  it('returns empty string when token is missing', () => {
    expect(getAccessTokenFromRequest({ headers: {} })).toBe('');
  });
});
