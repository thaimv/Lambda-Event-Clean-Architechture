import type { DeviceEndpointId } from '@common/types/datasources/push-notification.type';

export type EndpointAttributes = {
  metadata: Record<string, unknown>;
  enabled: boolean;
  token: string;
};

export enum NOTIFICATION_PROVIDER {
  SNS = 'sns',
}

export interface INotifierDatasource {
  publishMessage(receiver: string, message: string): Promise<void>;
}

export interface IEndpointManagerDatasource {
  getAttributes(endpointId: string): Promise<EndpointAttributes>;
  setActive(endpointId: string, isEnabled: boolean): Promise<void>;
  create(token: string, platform: string): Promise<string>;
  delete(endpointId: string): Promise<void>;
  deleteDeviceEndpoints(endpointIds: DeviceEndpointId[]): Promise<void>;
}

export interface INotificationDatasource {
  getNotifier(provider?: NOTIFICATION_PROVIDER): INotifierDatasource;
  getEndpointManager(provider?: NOTIFICATION_PROVIDER): IEndpointManagerDatasource;
}

/** @deprecated Use INotificationDatasource with getEndpointManager().deleteDeviceEndpoints() */
export type IPushNotificationDatasource = IEndpointManagerDatasource;
