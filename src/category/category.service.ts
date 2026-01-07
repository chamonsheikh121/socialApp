import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug already exists
    const existing = await this.prisma.client.pCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    const category = await this.prisma.client.pCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return category;
  }

  async findAll(includeInactive = false) {
    const categories = await this.prisma.client.pCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            postCategories: true,
          },
        },
      },
    });

    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.client.pCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            postCategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.client.pCategory.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            postCategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.client.pCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // If slug is being updated, check for conflicts
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.client.pCategory.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const updatedCategory = await this.prisma.client.pCategory.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });

    return updatedCategory;
  }

  async remove(id: string) {
    const category = await this.prisma.client.pCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            postCategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has posts
    if (category._count.postCategories > 0) {
      throw new ConflictException(
        'Cannot delete category with associated posts. Please remove posts first or set category as inactive.',
      );
    }

    await this.prisma.client.pCategory.delete({
      where: { id },
    });

    return {
      message: 'Category deleted successfully',
    };
  }
}
