/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePageInvitationDto, GetPageInvitationsDto } from './dto';

@Injectable()
export class PageInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  private getInvitationInclude() {
    return {
      page: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      sender: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          email: true,
        },
      },
      receiver: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          email: true,
        },
      },
    };
  }

  async create(userId: string, dto: CreatePageInvitationDto) {
    // Verify page exists
    const page = await this.prisma.client.page.findUnique({
      where: { id: dto.pageId },
      include: {
        owner: true,
        pageAdmins: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check if user is the owner or an admin of the page
    const isOwner = page.ownerId === userId;
    const isAdmin = page.pageAdmins.some((admin) => admin.userId === userId);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Only page owner or admins can send invitations',
      );
    }

    // Verify receiver exists
    const receiver = await this.prisma.client.user.findUnique({
      where: { id: dto.receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver user not found');
    }

    // Check if user is trying to invite themselves
    if (userId === dto.receiverId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    // Check if user is already a follower
    const existingFollower = await this.prisma.client.pageFollower.findUnique({
      where: {
        pageId_userId: {
          pageId: dto.pageId,
          userId: dto.receiverId,
        },
      },
    });

    if (existingFollower) {
      throw new ConflictException('User is already following this page');
    }

    // Check if invitation already exists
    const existingInvitation =
      await this.prisma.client.pageInvitation.findFirst({
        where: {
          pageId: dto.pageId,
          receiverId: dto.receiverId,
          isAccepted: false,
        },
      });

    if (existingInvitation) {
      throw new ConflictException('Invitation already sent to this user');
    }

    const invitation = await this.prisma.client.pageInvitation.create({
      data: {
        pageId: dto.pageId,
        senderId: userId,
        receiverId: dto.receiverId,
      },
      include: this.getInvitationInclude(),
    });

    return invitation;
  }

  async findAll(dto: GetPageInvitationsDto) {
    const {
      page = 1,
      limit = 10,
      pageId,
      senderId,
      receiverId,
      isAccepted,
    } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (pageId) {
      where.pageId = pageId;
    }

    if (senderId) {
      where.senderId = senderId;
    }

    if (receiverId) {
      where.receiverId = receiverId;
    }

    if (typeof isAccepted === 'boolean') {
      where.isAccepted = isAccepted;
    }

    const [invitations, total] = await Promise.all([
      this.prisma.client.pageInvitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.getInvitationInclude(),
      }),
      this.prisma.client.pageInvitation.count({ where }),
    ]);

    return {
      data: invitations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invitation = await this.prisma.client.pageInvitation.findUnique({
      where: { id },
      include: this.getInvitationInclude(),
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  async getMyInvitations(userId: string) {
    const invitations = await this.prisma.client.pageInvitation.findMany({
      where: {
        receiverId: userId,
        isAccepted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: this.getInvitationInclude(),
    });

    return invitations;
  }

  async getSentInvitations(userId: string) {
    const invitations = await this.prisma.client.pageInvitation.findMany({
      where: {
        senderId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: this.getInvitationInclude(),
    });

    return invitations;
  }

  async acceptInvitation(id: string, userId: string) {
    const invitation = await this.prisma.client.pageInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Only the receiver can accept the invitation
    if (invitation.receiverId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to accept this invitation',
      );
    }

    if (invitation.isAccepted) {
      throw new BadRequestException('Invitation already accepted');
    }

    // Check if user is already a follower
    const existingFollower = await this.prisma.client.pageFollower.findUnique({
      where: {
        pageId_userId: {
          pageId: invitation.pageId,
          userId: userId,
        },
      },
    });

    if (existingFollower) {
      throw new ConflictException('You are already following this page');
    }

    // Accept invitation and create follower record in a transaction
    const result = await this.prisma.client.$transaction(async (tx) => {
      const updatedInvitation = await tx.pageInvitation.update({
        where: { id },
        data: { isAccepted: true },
        include: this.getInvitationInclude(),
      });

      await tx.pageFollower.create({
        data: {
          pageId: invitation.pageId,
          userId: userId,
        },
      });

      return updatedInvitation;
    });

    return result;
  }

  async rejectInvitation(id: string, userId: string) {
    const invitation = await this.prisma.client.pageInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Only the receiver can reject the invitation
    if (invitation.receiverId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to reject this invitation',
      );
    }

    if (invitation.isAccepted) {
      throw new BadRequestException('Invitation already accepted');
    }

    await this.prisma.client.pageInvitation.delete({
      where: { id },
    });

    return { message: 'Invitation rejected successfully' };
  }

  async remove(id: string, userId: string) {
    const invitation = await this.prisma.client.pageInvitation.findUnique({
      where: { id },
      include: {
        page: {
          include: {
            pageAdmins: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Only the sender, page owner, or page admin can delete the invitation
    const isOwner = invitation.page.ownerId === userId;
    const isAdmin = invitation.page.pageAdmins.some(
      (admin) => admin.userId === userId,
    );
    const isSender = invitation.senderId === userId;

    if (!isOwner && !isAdmin && !isSender) {
      throw new ForbiddenException(
        'You are not allowed to delete this invitation',
      );
    }

    await this.prisma.client.pageInvitation.delete({
      where: { id },
    });

    return { message: 'Invitation deleted successfully' };
  }
}
