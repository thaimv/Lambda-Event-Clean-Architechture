import { Module } from '@common/decorators/module.decorator';
import { AppConfigModule } from '@lambda/config/di/app.config.di';
import { ApiGatewayDatasourceModule } from '@lambda/config/di/datasources/api-gateway.di';
import { CacheDatasourceModule } from '@lambda/config/di/datasources/cache.di';
import { JWT_AUTHORIZER_DI_CONST } from '@lambda/jwt-authorizer/consts';
import { JwtAuthorizerPresenter } from '@lambda/jwt-authorizer/presenter/index.presenter';
import { JwtSigningKeyRepo } from '@lambda/jwt-authorizer/repos/implements/jwt-signing-key.repo.impl';
import { VerifyTokenUseCase } from '@lambda/jwt-authorizer/usecases/implements/verify-token.uc.impl';

@Module({
  imports: [AppConfigModule, ApiGatewayDatasourceModule, CacheDatasourceModule],
  providers: [
    {
      provide: JWT_AUTHORIZER_DI_CONST.JwtSigningKeyRepo,
      useClass: JwtSigningKeyRepo,
    },
    {
      provide: JWT_AUTHORIZER_DI_CONST.VerifyTokenUseCase,
      useClass: VerifyTokenUseCase,
    },
    {
      provide: JWT_AUTHORIZER_DI_CONST.Presenter,
      useClass: JwtAuthorizerPresenter,
    },
  ],
})
export class JwtAuthorizerModule {}
