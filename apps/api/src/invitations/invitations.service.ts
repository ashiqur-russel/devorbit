import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Invitation } from './invitation.schema';
import { Organization } from '../organizations/organization.schema';
import { Team } from '../teams/team.schema';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function objectIdsEqual(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return false;
  try {
    const A = a instanceof Types.ObjectId ? a : new Types.ObjectId(String(a));
    const B = b instanceof Types.ObjectId ? b : new Types.ObjectId(String(b));
    return A.equals(B);
  } catch {
    return String(a) === String(b);
  }
}

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private usersService: UsersService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  private orgRole(org: Organization, userId: string): string | null {
    const uid = new Types.ObjectId(userId);
    const m = org.members.find((x) => x.userId.equals(uid));
    return m?.role ?? null;
  }

  async createInvite(params: {
    organizationId: string;
    actorUserId: string;
    email: string;
    teamId?: string;
  }) {
    const org = await this.orgModel.findById(params.organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    const role = this.orgRole(org, params.actorUserId);
    if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the organization super admin can send email invites');
    }

    const normalized = params.email.trim().toLowerCase();
    if (!normalized) throw new BadRequestException('Email required');

    let teamIdObj: Types.ObjectId | undefined;
    if (params.teamId) {
      const team = await this.teamModel.findById(params.teamId);
      if (!team || !team.organizationId?.equals(org._id as Types.ObjectId)) {
        throw new BadRequestException('Team does not belong to this organization');
      }
      teamIdObj = team._id as Types.ObjectId;
    }

    const existingUser = await this.usersService.findByEmail(normalized);
    if (existingUser) {
      throw new BadRequestException('This email already has an account. Add them from the team screen instead.');
    }

    const pending = await this.invitationModel.findOne({
      organizationId: org._id,
      email: normalized,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    if (pending) {
      throw new BadRequestException('An active invite already exists for this email');
    }

    const token = randomBytes(24).toString('hex');
    const inv = await this.invitationModel.create({
      organizationId: org._id,
      teamId: teamIdObj,
      email: normalized,
      token,
      invitedBy: new Types.ObjectId(params.actorUserId),
      status: 'pending',
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    const webUrl = (this.config.get<string>('WEB_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const registerUrl = `${webUrl}/register?invite=${token}`;

    const mailConfigured = this.mailService.isConfigured();
    let mailSent = false;
    let mailError: string | undefined;

    if (mailConfigured) {
      try {
        await this.mailService.send({
          to: normalized,
          subject: `You're invited to ${org.name} on Devorbit`,
          html: `<p>You were invited to join <strong>${org.name}</strong> on Devorbit.</p>
            <p><a href="${registerUrl}">Create your account and join</a> (link expires in 7 days).</p>`,
        });
        mailSent = true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Invite email failed for ${normalized}: ${msg}`);
        mailError = msg;
      }
    }

    return {
      token,
      registerUrl,
      email: normalized,
      expiresAt: inv.expiresAt,
      mailConfigured,
      mailSent,
      mailError,
    };
  }

  async getPreviewByToken(token: string) {
    const inv = await this.invitationModel.findOne({ token, status: 'pending' });
    if (!inv || inv.expiresAt < new Date()) {
      throw new NotFoundException('Invalid or expired invite');
    }
    const org = await this.orgModel.findById(inv.organizationId);
    if (!org) throw new NotFoundException('Organization missing');
    let teamName: string | null = null;
    if (inv.teamId) {
      const team = await this.teamModel.findById(inv.teamId);
      teamName = team?.name || null;
    }
    return {
      organizationId: String(org._id),
      email: inv.email,
      organizationName: org.name,
      organizationSlug: org.slug,
      teamName,
    };
  }

  async validatePendingForRegistration(token: string, email: string): Promise<Invitation> {
    const inv = await this.invitationModel.findOne({ token, status: 'pending' });
    if (!inv || inv.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }
    if (inv.email !== email.trim().toLowerCase()) {
      throw new BadRequestException('Email must match the invitation');
    }
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('An account with this email already exists. Sign in to join.');
    }
    return inv;
  }

  /** After email user is created: attach to org/team and close invite (single-use). */
  async completeInviteForNewUser(invitationId: string, newUserId: string) {
    if (!Types.ObjectId.isValid(invitationId)) {
      throw new BadRequestException('Invalid invitation id');
    }
    const closed = await this.invitationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(invitationId), status: 'pending' },
      { $set: { status: 'accepted' } },
      { new: true },
    );
    if (!closed) {
      throw new BadRequestException('Invite was already used or is no longer valid');
    }

    const orgOid =
      closed.organizationId instanceof Types.ObjectId
        ? closed.organizationId
        : new Types.ObjectId(String(closed.organizationId));

    const orgExists = await this.orgModel.exists({ _id: orgOid });
    if (!orgExists) throw new NotFoundException('Organization missing');

    const uid = new Types.ObjectId(newUserId);

    /**
     * Use atomic $push instead of load + save on Organization. Older member subdocuments in DB may
     * omit `canCreateTeams` / `canInstallAgent`; re-saving the whole document can trigger Mongoose
     * validation errors and a 500 on invite registration.
     */
    await this.orgModel.updateOne(
      { _id: orgOid, members: { $not: { $elemMatch: { userId: uid } } } },
      {
        $push: {
          members: {
            userId: uid,
            role: 'MEMBER',
            canCreateTeams: false,
            canInstallAgent: false,
          },
        },
      },
    );

    if (closed.teamId) {
      const team = await this.teamModel.findById(closed.teamId).select('organizationId');
      if (!team) return;
      if (!objectIdsEqual(team.organizationId, orgOid)) return;

      await this.teamModel.updateOne(
        { _id: closed.teamId, members: { $not: { $elemMatch: { userId: uid } } } },
        { $push: { members: { userId: uid, role: 'MEMBER' } } },
      );
    }
  }

  async listPendingForOrg(organizationId: string) {
    return this.invitationModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });
  }
}
