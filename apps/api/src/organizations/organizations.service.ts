import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization } from './organization.schema';
import { Team } from '../teams/team.schema';
import { UsersService } from '../users/users.service';
import { InvitationsService } from '../invitations/invitations.service';

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return base || 'org';
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private usersService: UsersService,
    private invitationsService: InvitationsService,
  ) {}

  async createWithSuperAdmin(userId: string, name: string): Promise<Organization> {
    const slug = `${slugify(name)}-${Date.now().toString(36)}`;
    return this.orgModel.create({
      name: name.trim(),
      slug,
      members: [
        {
          userId: new Types.ObjectId(userId),
          role: 'SUPER_ADMIN',
          canCreateTeams: false,
          canInstallAgent: false,
        },
      ],
    });
  }

  /** Create another organization; caller becomes SUPER_ADMIN. Only existing super admins (or first-time users with no orgs) may create. */
  async createAdditional(userId: string, name: string): Promise<Organization> {
    const uid = new Types.ObjectId(userId);
    const existing = await this.orgModel.find({ 'members.userId': uid });
    if (existing.length > 0) {
      const isSuperAnywhere = existing.some((o) => this.orgRole(o, userId) === 'SUPER_ADMIN');
      if (!isSuperAnywhere) {
        throw new ForbiddenException(
          'Only an organization super admin can create additional organizations. Ask your super admin to invite you or grant access.',
        );
      }
    }
    return this.createWithSuperAdmin(userId, name);
  }

  /** Whether this user may create teams in this org (super admin always; admin only if granted). */
  canMemberCreateTeams(org: Organization, userId: string): boolean {
    const uid = new Types.ObjectId(userId);
    const m = org.members.find((x) => x.userId.equals(uid));
    if (!m) return false;
    if (m.role === 'SUPER_ADMIN') return true;
    if (m.role === 'ADMIN' && m.canCreateTeams === true) return true;
    return false;
  }

  /** Whether this user may register agent servers for teams in this org. */
  canMemberInstallAgent(org: Organization, userId: string): boolean {
    const uid = new Types.ObjectId(userId);
    const m = org.members.find((x) => x.userId.equals(uid));
    if (!m) return false;
    if (m.role === 'SUPER_ADMIN') return true;
    if (m.role === 'ADMIN' && m.canInstallAgent === true) return true;
    return false;
  }

  async assertCanRegisterServer(actorUserId: string, teamId: string): Promise<void> {
    const team = await this.teamModel.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    if (!team.organizationId) {
      throw new BadRequestException('Team is not linked to an organization');
    }
    const org = await this.orgModel.findById(team.organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    if (!this.canMemberInstallAgent(org, actorUserId)) {
      throw new ForbiddenException(
        'Only the organization super admin or an org admin with agent-install permission can register servers.',
      );
    }
  }

  /**
   * UI/bootstrap: first-time user (no org memberships) may provision their first org/team/agent.
   * Otherwise capabilities come from org roles and super-admin grants on admins.
   */
  async getMyProvisioningCapabilities(userId: string): Promise<{
    canCreateTeams: boolean;
    canInstallAgent: boolean;
    hasAnyOrganization: boolean;
  }> {
    const orgs = await this.findMine(userId);
    if (orgs.length === 0) {
      return { canCreateTeams: true, canInstallAgent: true, hasAnyOrganization: false };
    }
    let canCreateTeams = false;
    let canInstallAgent = false;
    for (const org of orgs) {
      if (this.canMemberCreateTeams(org, userId)) canCreateTeams = true;
      if (this.canMemberInstallAgent(org, userId)) canInstallAgent = true;
      if (canCreateTeams && canInstallAgent) break;
    }
    return { canCreateTeams, canInstallAgent, hasAnyOrganization: true };
  }

  /** Super admin only: set which extra actions an org ADMIN may perform. */
  async setAdminCapabilities(
    orgId: string,
    actorUserId: string,
    dto: { email: string; canCreateTeams: boolean; canInstallAgent: boolean },
  ) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    if (this.orgRole(org, actorUserId) !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the organization super admin can update admin capabilities');
    }
    const normalized = dto.email.trim().toLowerCase();
    const target = await this.usersService.findByEmail(normalized);
    if (!target) throw new NotFoundException('User not found for that email');

    const tid = new Types.ObjectId(String(target._id));
    const entry = org.members.find((m) => m.userId.equals(tid));
    if (!entry || entry.role !== 'ADMIN') {
      throw new BadRequestException('That user must be an organization admin first (use Promote org admin).');
    }
    entry.canCreateTeams = dto.canCreateTeams;
    entry.canInstallAgent = dto.canInstallAgent;
    await org.save();
    return { ok: true, userId: tid.toString(), canCreateTeams: dto.canCreateTeams, canInstallAgent: dto.canInstallAgent };
  }

  async findMine(userId: string): Promise<Organization[]> {
    return this.orgModel.find({ 'members.userId': new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  orgRole(org: Organization, userId: string): string | null {
    const uid = new Types.ObjectId(userId);
    const m = org.members.find((x) => x.userId.equals(uid));
    return m?.role ?? null;
  }

  assertOrgAdmin(org: Organization, userId: string) {
    const role = this.orgRole(org, userId);
    if (!role || !['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new ForbiddenException('Organization admin or super admin required');
    }
  }

  async addUserToTeam(orgId: string, teamId: string, actorUserId: string, email: string) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    this.assertOrgAdmin(org, actorUserId);

    const team = await this.teamModel.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    if (!team.organizationId || !team.organizationId.equals(org._id as Types.ObjectId)) {
      throw new BadRequestException('Team does not belong to this organization');
    }

    const normalized = email.trim().toLowerCase();
    const target = await this.usersService.findByEmail(normalized);
    if (!target) {
      throw new NotFoundException(
        'No user with that email. They must register first (email or GitHub) before you can add them.',
      );
    }

    const tid = new Types.ObjectId(String(target._id));
    const actorOid = new Types.ObjectId(actorUserId);

    if (tid.equals(actorOid)) {
      throw new BadRequestException('You are already on this team');
    }

    const inOrg = org.members.some((m) => m.userId.equals(tid));
    if (!inOrg) {
      org.members.push({ userId: tid, role: 'MEMBER', canCreateTeams: false, canInstallAgent: false });
      await org.save();
    }

    const alreadyTeam = team.members.some((m) => m.userId.equals(tid));
    if (!alreadyTeam) {
      team.members.push({ userId: tid, role: 'MEMBER' });
      await team.save();
    }

    return { ok: true, userId: tid.toString(), teamId: team._id.toString() };
  }

  /** Super admin only: grant org ADMIN so they can manage teams and add members. */
  async promoteToOrgAdmin(orgId: string, actorUserId: string, targetEmail: string) {
    const org = await this.orgModel.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found');
    if (this.orgRole(org, actorUserId) !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the organization super admin can promote admins');
    }
    const normalized = targetEmail.trim().toLowerCase();
    const target = await this.usersService.findByEmail(normalized);
    if (!target) throw new NotFoundException('User not found for that email');

    const tid = new Types.ObjectId(String(target._id));
    const entry = org.members.find((m) => m.userId.equals(tid));
    if (entry?.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot change the organization super admin role');
    }
    if (!entry) {
      org.members.push({
        userId: tid,
        role: 'ADMIN',
        canCreateTeams: false,
        canInstallAgent: false,
      });
    } else {
      const wasNotAdmin = entry.role !== 'ADMIN';
      entry.role = 'ADMIN';
      if (wasNotAdmin) {
        entry.canCreateTeams = false;
        entry.canInstallAgent = false;
      }
    }
    await org.save();
    return { ok: true, userId: tid.toString(), role: 'ADMIN' };
  }

  async getDashboard(orgId: string, actorUserId: string) {
    const orgCheck = await this.orgModel.findById(orgId);
    if (!orgCheck) throw new NotFoundException('Organization not found');
    if (!this.orgRole(orgCheck, actorUserId)) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const org = await this.orgModel
      .findById(orgId)
      .populate('members.userId', 'name email avatar')
      .exec();
    if (!org) throw new NotFoundException('Organization not found');

    const teams = await this.teamModel.find({ organizationId: org._id }).sort({ name: 1 });
    const role = this.orgRole(org, actorUserId);
    const canSeeInvites = role === 'SUPER_ADMIN' || role === 'ADMIN';

    let pendingInvites: Array<{
      email: string;
      expiresAt: Date;
      teamId: string | null;
      teamName: string | null;
    }> = [];

    if (canSeeInvites) {
      const raw = await this.invitationsService.listPendingForOrg(orgId);
      pendingInvites = await Promise.all(
        raw.map(async (inv) => {
          let teamName: string | null = null;
          if (inv.teamId) {
            const t = await this.teamModel.findById(inv.teamId).select('name');
            teamName = t?.name ?? null;
          }
          return {
            email: inv.email,
            expiresAt: inv.expiresAt,
            teamId: inv.teamId ? String(inv.teamId) : null,
            teamName,
          };
        }),
      );
    }

    const members = org.members.map((m) => {
      const u = m.userId as unknown as { _id?: Types.ObjectId; name?: string; email?: string; avatar?: string };
      const uid = u?._id ?? (m.userId as Types.ObjectId);
      return {
        role: m.role,
        userId: String(uid),
        name: typeof u?.name === 'string' ? u.name : undefined,
        email: typeof u?.email === 'string' ? u.email : undefined,
        avatar: typeof u?.avatar === 'string' ? u.avatar : undefined,
        ...(m.role === 'ADMIN'
          ? { canCreateTeams: !!m.canCreateTeams, canInstallAgent: !!m.canInstallAgent }
          : {}),
      };
    });

    return {
      organization: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        members,
      },
      teams: teams.map((t) => ({
        _id: t._id,
        name: t.name,
        memberCount: Array.isArray(t.members) ? t.members.length : 0,
      })),
      pendingInvites,
    };
  }
}
