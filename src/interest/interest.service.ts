import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateInterestDto,
  UpdateInterestDto,
} from './dto/create-interest.dto';
import { NotFoundError, BadRequestError } from '../common/error';

@Injectable()
export class InterestService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(InterestService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(createInterestDto: CreateInterestDto) {
    this.logger.info({ title: createInterestDto.title }, 'Creating interest');

    // Check if interest already exists
    const existing = await this.prisma.client.interest.findUnique({
      where: { title: createInterestDto.title },
    });

    if (existing) {
      this.logger.warn(
        { title: createInterestDto.title },
        'Interest already exists',
      );
      throw new BadRequestError('Interest with this title already exists');
    }

    const interest = await this.prisma.client.interest.create({
      data: createInterestDto,
    });

    this.logger.info(
      { interestId: interest.id, title: interest.title },
      'Interest created successfully',
    );

    return {
      message: 'Interest created successfully',
      interest,
    };
  }

  async findAll() {
    this.logger.info('Getting all interests');

    const interests = await this.prisma.client.interest.findMany({
      orderBy: { title: 'asc' },
      include: {
        _count: {
          select: { userInterests: true },
        },
      },
    });

    this.logger.info({ count: interests.length }, 'Interests retrieved');

    return {
      message: 'Interests retrieved successfully',
      count: interests.length,
      interests,
    };
  }

  async findOne(id: string) {
    this.logger.info({ interestId: id }, 'Getting interest by ID');

    const interest = await this.prisma.client.interest.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userInterests: true },
        },
      },
    });

    if (!interest) {
      this.logger.warn({ interestId: id }, 'Interest not found');
      throw new NotFoundError('Interest not found');
    }

    return {
      message: 'Interest retrieved successfully',
      interest,
    };
  }

  async update(id: string, updateInterestDto: UpdateInterestDto) {
    this.logger.info({ interestId: id }, 'Updating interest');

    // Check if interest exists
    const existing = await this.prisma.client.interest.findUnique({
      where: { id },
    });

    if (!existing) {
      this.logger.warn({ interestId: id }, 'Interest not found');
      throw new NotFoundError('Interest not found');
    }

    // Check if title is being updated and if it conflicts
    if (updateInterestDto.title && updateInterestDto.title !== existing.title) {
      const titleConflict = await this.prisma.client.interest.findUnique({
        where: { title: updateInterestDto.title },
      });

      if (titleConflict) {
        throw new BadRequestError('Interest with this title already exists');
      }
    }

    const interest = await this.prisma.client.interest.update({
      where: { id },
      data: updateInterestDto,
    });

    this.logger.info({ interestId: id }, 'Interest updated successfully');

    return {
      message: 'Interest updated successfully',
      interest,
    };
  }

  async remove(id: string) {
    this.logger.info({ interestId: id }, 'Removing interest');

    const existing = await this.prisma.client.interest.findUnique({
      where: { id },
    });

    if (!existing) {
      this.logger.warn({ interestId: id }, 'Interest not found');
      throw new NotFoundError('Interest not found');
    }

    await this.prisma.client.interest.delete({
      where: { id },
    });

    this.logger.info({ interestId: id }, 'Interest removed successfully');

    return {
      message: 'Interest removed successfully',
    };
  }
}
