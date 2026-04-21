export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ITeamMember {
  userId: string;
  role: TeamRole;
}

export interface ITeam {
  _id: string;
  name: string;
  slug: string;
  members: ITeamMember[];
  createdAt: Date;
}
