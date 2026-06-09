export type User = {
  cognitoSub: string;
  userNickname: string;
  cognitoId: string | null;
  createDatetime: Date;
  createAuthor: string;
  updateDatetime: Date;
  updateAuthor: string;
  deleteDatetime: Date | null;
  deleteAuthor: string | null;
};
