import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePageDto, UpdatePageDto, AddPageAdminDto } from './dto';

@Injectable()
export class PageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePageDto) {
    // Check if username already exists
    const existingPage = await this.prisma.client.page.findUnique({
      where: { username: dto.username },
    });

    if (existingPage) {
      throw new ConflictException('Username is already taken');
    }

    // Use transaction to create page and automatically add owner as admin
    const result = await this.prisma.client.$transaction(async (tx) => {
      // Create the page
      const page = await tx.page.create({
        data: {
          name: dto.name,
          username: dto.username,
          description: dto.description,
          avatarUrl: dto.avatarUrl,
          coverPhotoUrl: dto.coverPhotoUrl,
          ownerId,
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Automatically add owner as admin
      await tx.pageAdmin.create({
        data: {
          pageId: page.id,
          userId: ownerId,
        },
      });

      return page;
    });

    return result;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      this.prisma.client.page.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              pageAdmins: true,
              pagePosts: true,
            },
          },
        },
      }),
      this.prisma.client.page.count(),
    ]);

    return {
      data: pages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const page = await this.prisma.client.page.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        pageAdmins: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            pagePosts: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async findByUsername(username: string) {
    const page = await this.prisma.client.page.findUnique({
      where: { username },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        pageAdmins: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            pagePosts: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(id: string, userId: string, dto: UpdatePageDto) {
    const page = await this.prisma.client.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check if user is owner or admin
    const isOwnerOrAdmin = await this.checkIfOwnerOrAdmin(id, userId);
    if (!isOwnerOrAdmin) {
      throw new ForbiddenException('You are not allowed to update this page');
    }

    const updatedPage = await this.prisma.client.page.update({
      where: { id },
      data: dto,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            pageAdmins: true,
            pagePosts: true,
          },
        },
      },
    });

    return updatedPage;
  }

  async remove(id: string, userId: string) {
    const page = await this.prisma.client.page.findUnique({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Only owner can delete page
    if (page.ownerId !== userId) {
      throw new ForbiddenException('Only page owner can delete the page');
    }

    await this.prisma.client.page.delete({
      where: { id },
    });

    return { message: 'Page deleted successfully' };
  }

  async addAdmin(pageId: string, userId: string, dto: AddPageAdminDto) {
    const page = await this.prisma.client.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Only owner can add admins
    if (page.ownerId !== userId) {
      throw new ForbiddenException('Only page owner can add admins');
    }

    // Check if user exists
    const user = await this.prisma.client.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already admin
    const existingAdmin = await this.prisma.client.pageAdmin.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId: dto.userId,
        },
      },
    });

    if (existingAdmin) {
      throw new ConflictException('User is already a page admin');
    }

    const pageAdmin = await this.prisma.client.pageAdmin.create({
      data: {
        pageId,
        userId: dto.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return pageAdmin;
  }

  async removeAdmin(pageId: string, userId: string, adminUserId: string) {
    const page = await this.prisma.client.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Only owner can remove admins
    if (page.ownerId !== userId) {
      throw new ForbiddenException('Only page owner can remove admins');
    }

    // Cannot remove owner as admin
    if (adminUserId === page.ownerId) {
      throw new ForbiddenException('Cannot remove page owner as admin');
    }

    const pageAdmin = await this.prisma.client.pageAdmin.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId: adminUserId,
        },
      },
    });

    if (!pageAdmin) {
      throw new NotFoundException('Admin not found');
    }

    await this.prisma.client.pageAdmin.delete({
      where: { id: pageAdmin.id },
    });

    return { message: 'Admin removed successfully' };
  }

  async getMyPages(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      this.prisma.client.page.findMany({
        where: { ownerId: userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              pageAdmins: true,
              pagePosts: true,
            },
          },
        },
      }),
      this.prisma.client.page.count({ where: { ownerId: userId } }),
    ]);

    return {
      data: pages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async checkIfOwnerOrAdmin(
    pageId: string,
    userId: string,
  ): Promise<boolean> {
    const page = await this.prisma.client.page.findUnique({
      where: { id: pageId },
    });

    if (page?.ownerId === userId) {
      return true;
    }

    const admin = await this.prisma.client.pageAdmin.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId,
        },
      },
    });

    return !!admin;
  }
}
