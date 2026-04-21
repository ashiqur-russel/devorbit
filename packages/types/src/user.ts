export interface IUser {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  githubId: string;
  createdAt: Date;
}
