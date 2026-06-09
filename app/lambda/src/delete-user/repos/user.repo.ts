export interface IUserRepo {
  deleteSoftDeletedUsersBefore(cutoffDatetime: Date): Promise<number>;
}
