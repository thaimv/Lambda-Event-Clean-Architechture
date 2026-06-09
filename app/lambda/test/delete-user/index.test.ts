import { ERROR_MESSAGE } from '@common/constants/response.const';
import { handler } from '@lambda/delete-user';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockHandle = vi.fn();

vi.mock('@lambda/config/di/di.config', () => ({
  bootstrapApplication: vi.fn(),
  getInstance: vi.fn(() => ({ handle: mockHandle })),
}));

vi.mock('@common/logger', () => ({
  logger: {
    addContext: vi.fn(),
    appendKeys: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  primaryLogger: {
    addContext: vi.fn(),
    appendKeys: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('delete user handler', () => {
  const event = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('success: wraps void result in SuccessResponse', async () => {
    mockHandle.mockResolvedValue(undefined);

    const result = await handler(event, {});

    expect(result.data).toBeUndefined();
    expect(result.result.code).toEqual('SC-001');
    expect(mockHandle).toHaveBeenCalledWith(event);
  });

  test('throw: propagates error through error handling pipe', async () => {
    mockHandle.mockRejectedValue(new Error('testerror'));

    const result = await handler(event, {});

    expect(result.result.code).toEqual('ES-001');
    expect(result.result.message).toEqual(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    expect(result.error?.error_message).toEqual(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  });
});
