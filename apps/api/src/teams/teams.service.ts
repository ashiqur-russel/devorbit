import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './team.schema';
import { Organization } from '../organizations/organization.schema';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
    private organizationsService: OrganizationsService,
  ) {}

  private slugify(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return `${base || 'team'}-${Date.now().toString(36)}`;
  }

  async createInOrganization(
    name: string,
    ownerId: string,
    organizationId: string,
  ): Promise<Team> {
    const org = await this.orgModel.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');

    if (!this.organizationsService.canMemberCreateTeams(org, ownerId)) {
      throw new ForbiddenException(
        'Only the organization super admin or an org admin with workspace-creation permission can create teams.',
      );
    }

    const oid = new Types.ObjectId(ownerId);
    const slug = this.slugify(name);
    return this.teamModel.create({
      name: name.trim(),
      slug,
      organizationId: new Types.ObjectId(organizationId),
      members: [{ userId: oid, role: 'OWNER' }],
    });
  }

  async findByMember(userId: string): Promise<Team[]> {
    return this.teamModel.find({ 'members.userId': new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<Team | null> {
    return this.teamModel.findById(id);
  }

  /**
   * Authorization: user may access team-scoped resources if they are either:
   * - a member of the team, OR
   * - a member of the parent organization (super admin/admin/member), when the team is linked to an org
   */
  async assertCanAccessTeam(userId: string, teamId: string): Promise<Team> {
    const tid = new Types.ObjectId(teamId);
    const uid = new Types.ObjectId(userId);

    const team = await this.teamModel.findById(tid);
    if (!team) throw new NotFoundException('Team not found');

    const isTeamMember = (team.members || []).some((m) => m.userId?.equals(uid));
    if (isTeamMember) return team;

    if (team.organizationId) {
      const orgMember = await this.orgModel.exists({ _id: team.organizationId, 'members.userId': uid });
      if (orgMember) return team;
    }

    throw new ForbiddenException('You do not have access to this team');
  }

  /**
   * Management permission for sensitive actions (e.g. deploy tokens).
   * Allowed if:
   * - user is team OWNER/ADMIN, OR
   * - user is an org SUPER_ADMIN/ADMIN for the team’s parent org.
   */
  async assertCanManageTeam(userId: string, teamId: string): Promise<Team> {
    const team = await this.assertCanAccessTeam(userId, teamId);
    const uid = new Types.ObjectId(userId);

    const entry = (team.members || []).find((m) => m.userId?.equals(uid));
    if (entry && (entry.role === 'OWNER' || entry.role === 'ADMIN')) return team;

    if (team.organizationId) {
      const org = await this.orgModel.findById(team.organizationId);
      const orgEntry = (org?.members || []).find((m) => m.userId?.equals(uid));
      if (orgEntry && (orgEntry.role === 'SUPER_ADMIN' || orgEntry.role === 'ADMIN')) return team;
    }

    throw new ForbiddenException('You do not have permission to manage this team');
  }
}
