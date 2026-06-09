import { ValidationError } from '@common/errors/validation-error';
import { JwtAuthorizerPresenter } from '@lambda/jwt-authorizer/presenter/index.presenter';
import type { IVerifyTokenUseCase } from '@lambda/jwt-authorizer/usecases/verify-token.uc';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('JwtAuthorizerPresenter', () => {
  let presenter: JwtAuthorizerPresenter;
  let executeMock: ReturnType<typeof vi.fn>;

  const jwtPayload = Buffer.from('{"sub": "userId"}').toString('base64');
  const event = {
    headers: { cookie: `project_access_token=jwtTest.${jwtPayload}.jwtSign` },
    methodArn: 'test1:test2:test3:test4:test5:test6',
  };

  beforeEach(() => {
    executeMock = vi.fn();
    const useCase = { execute: executeMock } as IVerifyTokenUseCase;
    presenter = new JwtAuthorizerPresenter(useCase);
  });

  it('validates input and delegates token to use case', async () => {
    const policy = {
      principalId: '',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          { Action: 'execute-api:Invoke', Effect: 'Allow' as const, Resource: event.methodArn },
        ],
      },
    };
    executeMock.mockResolvedValue(policy);

    const result = await presenter.handle(event as never);

    expect(executeMock).toHaveBeenCalledWith({
      token: `jwtTest.${jwtPayload}.jwtSign`,
      methodArn: event.methodArn,
    });
    expect(result).toEqual(policy);
  });

  it('throws ValidationError when methodArn is missing', async () => {
    await expect(presenter.handle({ headers: event.headers } as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('throws ValidationError when token is missing from cookie', async () => {
    await expect(
      presenter.handle({ headers: {}, methodArn: event.methodArn } as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('reads token from Cookie header with capital C', async () => {
    const policy = {
      principalId: '',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          { Action: 'execute-api:Invoke', Effect: 'Allow' as const, Resource: event.methodArn },
        ],
      },
    };
    executeMock.mockResolvedValue(policy);

    await presenter.handle({
      headers: { Cookie: event.headers.cookie },
      methodArn: event.methodArn,
    } as never);

    expect(executeMock).toHaveBeenCalledWith({
      token: `jwtTest.${jwtPayload}.jwtSign`,
      methodArn: event.methodArn,
    });
  });

  it('reads token from Authorization bearer header', async () => {
    const policy = {
      principalId: '',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          { Action: 'execute-api:Invoke', Effect: 'Allow' as const, Resource: event.methodArn },
        ],
      },
    };
    executeMock.mockResolvedValue(policy);

    await presenter.handle({
      headers: { authorization: `Bearer jwtTest.${jwtPayload}.jwtSign` },
      methodArn: event.methodArn,
    } as never);

    expect(executeMock).toHaveBeenCalledWith({
      token: `jwtTest.${jwtPayload}.jwtSign`,
      methodArn: event.methodArn,
    });
  });

  it('reads token from multiValueHeaders cookie arrays', async () => {
    const policy = {
      principalId: '',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          { Action: 'execute-api:Invoke', Effect: 'Allow' as const, Resource: event.methodArn },
        ],
      },
    };
    executeMock.mockResolvedValue(policy);

    await presenter.handle({
      multiValueHeaders: { cookie: [event.headers.cookie] },
      methodArn: event.methodArn,
    } as never);

    await presenter.handle({
      multiValueHeaders: { Cookie: [event.headers.cookie] },
      methodArn: event.methodArn,
    } as never);

    expect(executeMock).toHaveBeenCalledTimes(2);
  });
});
