import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { GetBookmarksDto } from './dto/get-bookmarks.dto';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createBookmarkDto: CreateBookmarkDto) {
    // Check if bookmark already exists
    const existingBookmark = await this.prisma.client.bookmark.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId: createBookmarkDto.contentId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictException('Bookmark already exists');
    }

    // Verify the post exists
    const post = await this.prisma.client.post.findUnique({
      where: { id: createBookmarkDto.contentId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return await this.prisma.client.bookmark.create({
      data: {
        userId,
        contentId: createBookmarkDto.contentId,
      },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, query: GetBookmarksDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
    };

    const [bookmarks, total] = await Promise.all([
      this.prisma.client.bookmark.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          post: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.client.bookmark.count({ where }),
    ]);

    return {
      data: bookmarks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const bookmark = await this.prisma.client.bookmark.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('You do not have access to this bookmark');
    }

    return bookmark;
  }

  async checkBookmark(userId: string, contentId: string) {
    const bookmark = await this.prisma.client.bookmark.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });

    return {
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?.id || null,
    };
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.client.bookmark.delete({
      where: { id },
    });

    return {
      message: 'Bookmark removed successfully',
    };
  }

  async removeByContent(userId: string, contentId: string) {
    const bookmark = await this.prisma.client.bookmark.findUnique({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.client.bookmark.delete({
      where: { id: bookmark.id },
    });

    return {
      message: 'Bookmark removed successfully',
    };
  }
}
