import {
  SNSClient,
  CreatePlatformEndpointCommand,
  DeleteEndpointCommand,
  GetEndpointAttributesCommand,
  SetEndpointAttributesCommand,
} from '@aws-sdk/client-sns';
import { ERROR_MESSAGE } from '@common/constants/response.const';
import type {
  EndpointAttributes,
  IEndpointManagerDatasource,
} from '@common/datasources/push-notification/push-notification.datasource';
import { BadRequestError } from '@common/errors/bad-request-error';
import { logger } from '@common/logger';
import type { DeviceEndpointId } from '@common/types/datasources/push-notification.type';

export class SnsEndpointManagerDatasource implements IEndpointManagerDatasource {
  constructor(protected readonly snsClient: SNSClient = new SNSClient()) {}

  async getAttributes(endpointId: string): Promise<EndpointAttributes> {
    const command = new GetEndpointAttributesCommand({
      EndpointArn: endpointId,
    });
    const response = await this.snsClient.send(command);

    const attributes = response?.Attributes;
    if (!attributes) {
      throw new BadRequestError(ERROR_MESSAGE.SNS_GET_ENDPOINT_ATTRIBUTES_ERROR);
    }

    const customUserData = attributes.CustomUserData ?? '';
    const enabled = attributes.Enabled?.toLowerCase() === 'true';
    const token = attributes.Token ?? '';

    return {
      metadata: { customUserData },
      enabled,
      token,
    };
  }

  async setActive(endpointId: string, isEnabled: boolean): Promise<void> {
    const command = new SetEndpointAttributesCommand({
      EndpointArn: endpointId,
      Attributes: {
        Enabled: `${isEnabled}`,
      },
    });
    await this.snsClient.send(command);
  }

  async create(token: string, platform: string): Promise<string> {
    const command = new CreatePlatformEndpointCommand({
      PlatformApplicationArn: platform,
      Token: token,
    });
    const response = await this.snsClient.send(command);
    if (!response?.EndpointArn) {
      throw new BadRequestError(ERROR_MESSAGE.SNS_CREATE_ENDPOINT_ERROR);
    }
    return response.EndpointArn;
  }

  async delete(endpointId: string): Promise<void> {
    const command = new DeleteEndpointCommand({
      EndpointArn: endpointId,
    });
    const response = await this.snsClient.send(command);
    if (response?.$metadata?.httpStatusCode !== 200) {
      throw new BadRequestError(ERROR_MESSAGE.SNS_DELETE_ENDPOINT_ERROR);
    }
  }

  async deleteDeviceEndpoints(endpointIds: DeviceEndpointId[]): Promise<void> {
    if (endpointIds.length === 0) {
      logger.info('No push notification device endpoints to delete');
      return;
    }

    const results = await Promise.allSettled(
      endpointIds.map((endpointId) => this.delete(endpointId)),
    );

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      logger.error('Some push notification device endpoint deletions failed', {
        totalRequests: endpointIds.length,
        failedCount: failures.length,
        errors: failures.map((f) => (f as PromiseRejectedResult).reason),
      });
      throw new Error(`Failed to delete ${failures.length} push notification device endpoints`);
    }

    logger.info('Successfully deleted all push notification device endpoints', {
      count: endpointIds.length,
    });
  }
}
