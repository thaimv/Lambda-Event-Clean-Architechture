import { SnsEndpointManagerDatasource } from '@common/datasources/push-notification/implements/aws-sns-endpoint-manager.datasource.impl';
import { SnsNotifierDatasource } from '@common/datasources/push-notification/implements/aws-sns-notifier.datasource.impl';
import { NotificationDatasource } from '@common/datasources/push-notification/implements/push-notification.datasource.impl';
import { NOTIFICATION_PROVIDER } from '@common/datasources/push-notification/push-notification.datasource';
import { BaseError } from '@common/errors/base-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const sendMock = vi.fn();

vi.mock('@aws-sdk/client-sns', () => ({
  SNSClient: vi.fn(() => ({ send: sendMock })),
  PublishCommand: vi.fn((params) => ({ __type: 'PublishCommand', ...params })),
  GetEndpointAttributesCommand: vi.fn((params) => ({
    __type: 'GetEndpointAttributesCommand',
    ...params,
  })),
  SetEndpointAttributesCommand: vi.fn((params) => ({
    __type: 'SetEndpointAttributesCommand',
    ...params,
  })),
  CreatePlatformEndpointCommand: vi.fn((params) => ({
    __type: 'CreatePlatformEndpointCommand',
    ...params,
  })),
  DeleteEndpointCommand: vi.fn((params) => ({ __type: 'DeleteEndpointCommand', ...params })),
}));

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

vi.mock('@common/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('NotificationDatasource + SnsNotifierDatasource + SnsEndpointManagerDatasource', () => {
  let notificationService: NotificationDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = new NotificationDatasource(createMockAppConfig());
  });

  it('should create NotificationDatasource instance', () => {
    expect(notificationService).toBeInstanceOf(NotificationDatasource);
  });

  it('should return SnsNotifierDatasource instance from getNotifier()', () => {
    const notifier = notificationService.getNotifier(NOTIFICATION_PROVIDER.SNS);
    expect(notifier).toBeInstanceOf(SnsNotifierDatasource);
  });

  it('should return SnsEndpointManagerDatasource instance from getEndpointManager()', () => {
    const endpointMgr = notificationService.getEndpointManager(NOTIFICATION_PROVIDER.SNS);
    expect(endpointMgr).toBeInstanceOf(SnsEndpointManagerDatasource);
  });

  it('should cache notifier and endpoint manager for same provider', () => {
    const n1 = notificationService.getNotifier(NOTIFICATION_PROVIDER.SNS);
    const n2 = notificationService.getNotifier(NOTIFICATION_PROVIDER.SNS);
    const e1 = notificationService.getEndpointManager(NOTIFICATION_PROVIDER.SNS);
    const e2 = notificationService.getEndpointManager(NOTIFICATION_PROVIDER.SNS);
    expect(n1).toBe(n2);
    expect(e1).toBe(e2);
  });

  it('should throw for unsupported notification provider', () => {
    expect(() => notificationService.getNotifier('unsupported' as NOTIFICATION_PROVIDER)).toThrow(
      'Unsupported notification provider: unsupported',
    );
  });

  describe('SnsNotifierDatasource', () => {
    let notifier: SnsNotifierDatasource;

    beforeEach(() => {
      notifier = notificationService.getNotifier(
        NOTIFICATION_PROVIDER.SNS,
      ) as SnsNotifierDatasource;
    });

    it('should call SNSClient.send() with correct PublishCommand', async () => {
      sendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

      await notifier.publishMessage('arn:aws:sns:1234', '{"default":"msg"}');

      expect(sendMock).toHaveBeenCalledTimes(1);
      const arg = sendMock.mock.calls[0][0];
      expect(arg.__type).toBe('PublishCommand');
      expect(arg.TargetArn).toBe('arn:aws:sns:1234');
    });

    it('should throw when SNSClient.send() fails', async () => {
      sendMock.mockRejectedValueOnce(new Error('SNS error'));
      await expect(notifier.publishMessage('arn', 'msg')).rejects.toThrow('SNS error');
    });
  });

  describe('SnsEndpointManagerDatasource', () => {
    let endpointMgr: SnsEndpointManagerDatasource;

    beforeEach(() => {
      endpointMgr = notificationService.getEndpointManager(
        NOTIFICATION_PROVIDER.SNS,
      ) as SnsEndpointManagerDatasource;
    });

    it('should get endpoint attributes successfully', async () => {
      sendMock.mockResolvedValueOnce({
        Attributes: {
          CustomUserData: 'metadata',
          Enabled: 'true',
          Token: 'abc123',
        },
      });

      const result = await endpointMgr.getAttributes('endpoint-1');

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        metadata: { customUserData: 'metadata' },
        enabled: true,
        token: 'abc123',
      });
    });

    it('should default missing optional attributes', async () => {
      sendMock.mockResolvedValueOnce({
        Attributes: {
          Enabled: 'false',
        },
      });

      const result = await endpointMgr.getAttributes('endpoint-1');

      expect(result).toEqual({
        metadata: { customUserData: '' },
        enabled: false,
        token: '',
      });
    });

    it('should throw BaseError if attributes missing', async () => {
      sendMock.mockResolvedValueOnce({});
      await expect(endpointMgr.getAttributes('endpoint-1')).rejects.toThrow(BaseError);
    });

    it('should call setAttributes with Enabled flag', async () => {
      sendMock.mockResolvedValueOnce({});
      await endpointMgr.setActive('endpoint-1', true);
      expect(sendMock).toHaveBeenCalled();
      const arg = sendMock.mock.calls[0][0];
      expect(arg.__type).toBe('SetEndpointAttributesCommand');
      expect(arg.Attributes.Enabled).toBe('true');
    });

    it('should create endpoint and return ARN', async () => {
      sendMock.mockResolvedValueOnce({ EndpointArn: 'arn:ok' });
      const arn = await endpointMgr.create('token-1', 'platform-arn');
      expect(sendMock).toHaveBeenCalled();
      expect(arn).toBe('arn:ok');
    });

    it('should throw BaseError if EndpointArn missing', async () => {
      sendMock.mockResolvedValueOnce({});
      await expect(endpointMgr.create('token', 'platform')).rejects.toThrow(BaseError);
    });

    it('should delete endpoint successfully (http 200)', async () => {
      sendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });
      await endpointMgr.delete('endpoint-1');
      expect(sendMock).toHaveBeenCalled();
    });

    it('should throw BaseError if delete fails', async () => {
      sendMock.mockResolvedValueOnce({ $metadata: { httpStatusCode: 500 } });
      await expect(endpointMgr.delete('endpoint-1')).rejects.toThrow(BaseError);
    });

    it('should delete multiple device endpoints successfully', async () => {
      sendMock.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

      await endpointMgr.deleteDeviceEndpoints(['endpoint-1', 'endpoint-2']);

      expect(sendMock).toHaveBeenCalledTimes(2);
    });

    it('should not call delete when endpoint array is empty', async () => {
      await endpointMgr.deleteDeviceEndpoints([]);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it('should throw error when any endpoint deletion fails', async () => {
      sendMock
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 500 } });

      await expect(endpointMgr.deleteDeviceEndpoints(['endpoint-1', 'endpoint-2'])).rejects.toThrow(
        'Failed to delete 1 push notification device endpoints',
      );
    });
  });
});
