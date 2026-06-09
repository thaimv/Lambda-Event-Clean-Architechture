/** API Gateway Lambda authorizer response (IAM policy document). */
export type AuthorizerResult = {
  principalId: string;
  policyDocument: {
    Version: string;
    Statement: { Action: string; Effect: 'Allow' | 'Deny'; Resource: string }[];
  };
};
