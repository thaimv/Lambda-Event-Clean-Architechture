import { API_GATEWAY_RESPONSE_FORMAT } from '@common/constants/format.const';
import { ApiGatewayDatasource } from '@common/datasources/api-gateway/implements/api-gateway.datasource.impl';
import { BadRequestError } from '@common/errors/bad-request-error';
import { logger } from '@common/logger';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@common/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

describe('ApiGatewayDatasource', () => {
  let datasource: ApiGatewayDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    datasource = new ApiGatewayDatasource();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('invokes API and parses JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      }),
    );

    const result = await datasource.invoke<{ ok: boolean }>(
      'https://api.example.com/data',
      'POST',
      {
        body: { id: 1 },
        headers: { Authorization: 'Bearer token' },
      },
    );

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: JSON.stringify({ id: 1 }),
    });
    expect(logger.info).toHaveBeenCalled();
  });

  test('passes string body without re-serializing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      }),
    );

    await datasource.invoke('https://api.example.com/data', 'PUT', { body: 'raw-body' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({ body: 'raw-body' }),
    );
  });

  test('returns raw text when response format is TEXT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'plain-text-response',
      }),
    );

    const result = await datasource.invoke<string>(
      'https://api.example.com/data',
      'GET',
      undefined,
      { format: API_GATEWAY_RESPONSE_FORMAT.TEXT },
    );

    expect(result).toBe('plain-text-response');
  });

  test('throws BadRequestError when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => JSON.stringify({ message: 'bad gateway' }),
      }),
    );

    await expect(datasource.invoke('https://api.example.com/data', 'GET')).rejects.toBeInstanceOf(
      BadRequestError,
    );

    expect(logger.error).toHaveBeenCalledWith(
      'call-api-gateway-failed',
      expect.objectContaining({ status: 502 }),
    );
  });

  test('logs raw text response when error format is TEXT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'plain-error-body',
      }),
    );

    await expect(
      datasource.invoke('https://api.example.com/data', 'GET', undefined, {
        format: API_GATEWAY_RESPONSE_FORMAT.TEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(logger.error).toHaveBeenCalledWith(
      'call-api-gateway-failed',
      expect.objectContaining({ response: 'plain-error-body' }),
    );
  });
});
