// @ts-nocheck — template file; path aliases resolve correctly in generated output under app/lambda/test/
import { ValidationError } from '@common/errors/validation-error';
import { <PresenterClass> } from '@lambda/<lambda-name>/presenter/index.presenter';
import type { I<UseCaseInterface> } from '@lambda/<lambda-name>/usecases/<uc-interface>.uc';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('<PresenterClass>', () => {
  let presenter: <PresenterClass>;
  let executeMock: ReturnType<typeof vi.fn>;

  const validEvent = {
    // Replace with actual event shape
    headers: { cookie: 'project_access_token=jwt.payload.sig' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    executeMock = vi.fn();
    const useCase = { execute: executeMock } as I<UseCaseInterface>;
    presenter = new <PresenterClass>(useCase);
  });

  // --- Happy Path ---

  it('delegates to use case with extracted args and returns result', async () => {
    // Arrange
    const expected = { resultCode: 'SC-001' };
    executeMock.mockResolvedValue(expected);

    // Act
    const result = await presenter.handle(validEvent as never);

    // Assert
    expect(executeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        // extracted fields from event
      }),
    );
    expect(result).toEqual(expected);
  });

  // --- Validation Errors ---

  it('throws ValidationError when required field is missing', async () => {
    const eventWithoutField = { headers: {} };

    await expect(presenter.handle(eventWithoutField as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  // --- Alternative Header Paths ---

  it('reads field from alternative header format', async () => {
    executeMock.mockResolvedValue({ resultCode: 'SC-001' });
    const altEvent = {
      headers: { Authorization: 'Bearer jwt.payload.sig' },
    };

    await presenter.handle(altEvent as never);

    expect(executeMock).toHaveBeenCalledOnce();
  });
});
