import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team } from './team.schema';
import { Organization } from '../organizations/organization.schema';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(Organization.name) private orgModel: Model<Organization>,
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

    const oid = new Types.ObjectId(ownerId);
    const m = org.members.find((x) => x.userId.equals(oid));
    if (!m || !['SUPER_ADMIN', 'ADMIN'].includes(m.role)) {
      throw new ForbiddenException('Only organization super admins or admins can create teams');
    }

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
}
