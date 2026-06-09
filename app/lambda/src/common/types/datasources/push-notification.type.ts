/** Identifier of a registered push notification device endpoint. */
export type DeviceEndpointId = string;

export type DeleteDeviceEndpointOutput = {
  $metadata?: {
    httpStatusCode?: number;
    requestId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
};
