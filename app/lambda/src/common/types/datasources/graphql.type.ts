export type GraphQLLambdaResponse = {
  StatusCode: number;
  Payload?: Uint8Array;
};

export type GraphQLResponsePayload<T = unknown> = {
  data?: T;
  success?: boolean;
  message?: string;
  errors?: Array<{ message: string }>;
};

export type IdentityGraphQLInput = {
  cognitoIdentityAuthProvider?: string;
  username?: string;
};
