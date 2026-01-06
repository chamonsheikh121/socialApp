/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FileUploadService } from '../common/file-upload.service';
import { CreatePostDto, UpdatePostDto, GetPostsDto } from './dto';
import { MediaType } from 'generated/prisma/enums';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(
    userId: string,
    dto: CreatePostDto,
    images?: Express.Multer.File[],
  ) {
    // Validate images
    if (images && images.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed per post');
    }

    // Validate categories if provided
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const categories = await this.prisma.client.pCategory.findMany({
        where: {
          id: { in: dto.categoryIds },
          isActive: true,
        },
      });

      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException(
          'One or more categories not found or inactive',
        );
      }
    }

    // Upload images to cloudinary
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          const url = await this.fileUploadService.uploadFile(
            image,
            'social-app/posts',
          );
          imageUrls.push(url);
        } catch (error) {
          throw new BadRequestException(
            `Failed to upload image: ${error.message}`,
          );
        }
      }
    }

    let hashtags = dto.hashtags || [];

    hashtags = hashtags[0].split(',');

    console.log('Hashtags:');

    // Prepare hashtag connections - create or connect to existing hashtags
    const hashtagData = hashtags
      ? {
          create: hashtags.map((hashtagName) => ({
            hashtag: {
              connectOrCreate: {
                where: { name: hashtagName.toLowerCase() },
                create: {
                  name: hashtagName.toLowerCase(),
                  trendCount: 1,
                },
              },
            },
          })),
        }
      : undefined;

    // Create post with categories, media, and hashtags
    const post = await this.prisma.client.post.create({
      data: {
        userId,
        content: dto.content,
        isPublic: dto.isPublic,
        postCategories: dto.categoryIds
          ? {
              createMany: {
                data: dto.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : undefined,
        postHashtags: hashtagData,
        media:
          imageUrls.length > 0
            ? {
                createMany: {
                  data: imageUrls.map((url) => ({
                    url,
                    type: MediaType.IMAGE,
                  })),
                },
              }
            : undefined,
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
        postCategories: {
          include: {
            category: true,
          },
        },
        postHashtags: {
          include: {
            hashtag: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    return post;
  }

  async findAll(dto: GetPostsDto) {
    const { page = 1, limit = 10, userId, postType, categoryId, search } = dto;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublic: true,
    };

    if (userId) {
      where.userId = userId;
    }

    if (postType) {
      where.postType = postType;
    }

    if (categoryId) {
      where.postCategories = {
        some: {
          categoryId,
        },
      };
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.client.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
          postCategories: {
            include: {
              category: true,
            },
          },
          media: true,
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
      }),
      this.prisma.client.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const post = await this.prisma.client.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,

            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        postCategories: {
          include: {
            category: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if post is private and user is not the owner
    if (!post.isPublic && post.userId !== userId) {
      throw new ForbiddenException('You do not have access to this post');
    }

    // If user is authenticated, check if they liked or bookmarked the post
    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const [like, bookmark] = await Promise.all([
        this.prisma.client.like.findFirst({
          where: { postId: id, userId },
        }),
        this.prisma.client.bookmark.findFirst({
          where: { contentId: id, userId },
        }),
      ]);

      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    return {
      ...post,
      isLiked,
      isBookmarked,
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePostDto,
    images?: Express.Multer.File[],
  ) {
    const post = await this.prisma.client.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Validate images
    if (images && images.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed per post');
    }

    // Validate categories if provided
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const categories = await this.prisma.client.pCategory.findMany({
        where: {
          id: { in: dto.categoryIds },
          isActive: true,
        },
      });

      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException(
          'One or more categories not found or inactive',
        );
      }
    }

    // Upload new images
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          const url = await this.fileUploadService.uploadFile(
            image,
            'social-app/posts',
          );
          imageUrls.push(url);
        } catch (error) {
          throw new BadRequestException(
            `Failed to upload image: ${error.message}`,
          );
        }
      }
    }

    // Update post
    const updatedPost = await this.prisma.client.post.update({
      where: { id },
      data: {
        content: dto.content,
        isPublic: dto.isPublic,
        postCategories: dto.categoryIds
          ? {
              deleteMany: {},
              createMany: {
                data: dto.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : undefined,
        media:
          imageUrls.length > 0
            ? {
                createMany: {
                  data: imageUrls.map((url) => ({
                    url,
                    type: MediaType.IMAGE,
                  })),
                },
              }
            : undefined,
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
        postCategories: {
          include: {
            category: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    });

    return updatedPost;
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.client.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.client.post.delete({
      where: { id },
    });

    return {
      message: 'Post deleted successfully',
    };
  }
}
