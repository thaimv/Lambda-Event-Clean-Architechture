import { z } from 'zod';

export const VerifyTokenRequestSchema = z.object({
  token: z.string().min(1, 'token is required'),
  methodArn: z.string().min(1, 'methodArn is required'),
});

export type VerifyTokenRequestDto = z.infer<typeof VerifyTokenRequestSchema>;
