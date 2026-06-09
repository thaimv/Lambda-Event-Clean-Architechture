export const JWT_AUTHORIZER_DI_CONST = {
  Presenter: Symbol.for('JwtAuthorizerPresenter'),
  VerifyTokenUseCase: Symbol.for('JwtAuthorizerVerifyTokenUseCase'),
  JwtSigningKeyRepo: Symbol.for('JwtAuthorizerJwtSigningKeyRepo'),
};

export const AUTHORIZER_POLICY_CONST = {
  VERSION: '2012-10-17',
  ACTION: 'execute-api:Invoke',
};
