/**
 * RSA JSON Web Key used for JWT signature verification (RFC 7517).
 */
export type JwtSigningKey = {
  kty: 'RSA';
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
};
