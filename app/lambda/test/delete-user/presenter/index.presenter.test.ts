import { DeleteUserPresenter } from '@lambda/delete-user/presenter/index.presenter';
import type { IDeleteUserUseCase } from '@lambda/delete-user/usecases/delete-user.uc';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DeleteUserPresenter', () => {
  let presenter: DeleteUserPresenter;
  let executeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    executeMock = vi.fn();
    const useCase = { execute: executeMock } as IDeleteUserUseCase;
    presenter = new DeleteUserPresenter(useCase);
  });

  it('delegates to delete user use case', async () => {
    executeMock.mockResolvedValue(undefined);

    await presenter.handle({} as never);

    expect(executeMock).toHaveBeenCalledOnce();
  });
});
