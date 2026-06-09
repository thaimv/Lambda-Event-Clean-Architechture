import { SNSClient } from '@aws-sdk/client-sns';
import { DI } from '@common/constants/di.const';
import { SnsEndpointManagerDatasource } from '@common/datasources/push-notification/implements/aws-sns-endpoint-manager.datasource.impl';
import { SnsNotifierDatasource } from '@common/datasources/push-notification/implements/aws-sns-notifier.datasource.impl';
import type {
  IEndpointManagerDatasource,
  INotificationDatasource,
  INotifierDatasource,
} from '@common/datasources/push-notification/push-notification.datasource';
import { NOTIFICATION_PROVIDER } from '@common/datasources/push-notification/push-notification.datasource';
import { BadRequestError } from '@common/errors/bad-request-error';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class NotificationDatasource implements INotificationDatasource {
  private readonly snsClient: SNSClient;
  private readonly notifiers = new Map<NOTIFICATION_PROVIDER, INotifierDatasource>();
  private readonly endpoints = new Map<NOTIFICATION_PROVIDER, IEndpointManagerDatasource>();

  private readonly notifierFactories: Record<NOTIFICATION_PROVIDER, () => INotifierDatasource>;
  private readonly endpointFactories: Record<
    NOTIFICATION_PROVIDER,
    () => IEndpointManagerDatasource
  >;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.snsClient = new SNSClient({ region: appConfig.awsConfig.region });
    this.notifierFactories = {
      [NOTIFICATION_PROVIDER.SNS]: () => new SnsNotifierDatasource(this.snsClient),
    };
    this.endpointFactories = {
      [NOTIFICATION_PROVIDER.SNS]: () => new SnsEndpointManagerDatasource(this.snsClient),
    };
  }

  getNotifier(provider: NOTIFICATION_PROVIDER = NOTIFICATION_PROVIDER.SNS): INotifierDatasource {
    return this.resolveInstance(this.notifiers, provider, this.notifierFactories);
  }

  getEndpointManager(
    provider: NOTIFICATION_PROVIDER = NOTIFICATION_PROVIDER.SNS,
  ): IEndpointManagerDatasource {
    return this.resolveInstance(this.endpoints, provider, this.endpointFactories);
  }

  private resolveInstance<T>(
    cache: Map<NOTIFICATION_PROVIDER, T>,
    provider: NOTIFICATION_PROVIDER,
    factories: Record<NOTIFICATION_PROVIDER, () => T>,
  ): T {
    const cached = cache.get(provider);
    if (cached) return cached;

    const factory = factories[provider];
    if (!factory) throw new BadRequestError(`Unsupported notification provider: ${provider}`);

    const instance = factory();
    cache.set(provider, instance);
    return instance;
  }
}
