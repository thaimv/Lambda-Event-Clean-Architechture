export type UnprocessedIdentityId = {
  IdentityId?: string;
  ErrorCode?: string;
};

export type DeleteIdentitiesOutput = {
  UnprocessedIdentityIds?: UnprocessedIdentityId[];
};

export type GetOpenIdTokenOutput = {
  identityId: string;
  token: string;
};
