import type { User } from '@common/models/user.model';

export interface IUserRepo {
  getUser(cognitoId: string): Promise<User | null>;
}
