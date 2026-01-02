import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserInterestService } from './userInterest.service';
import {
  CreateUserInterestDto,
  UpdateUserInterestDto,
} from './dto/create-userInterest.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { jwtPayloadDto } from '../auth/dto/jwtPayload.dto';

@ApiTags('User Interests')
@ApiBearerAuth()
@Controller('user/interests')
export class UserInterestController {
  constructor(private readonly userInterestService: UserInterestService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Add a new interest for the current user' })
  @ApiResponse({ status: 201, description: 'Interest added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - interest already exists',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  create(
    @CurrentUser() user: jwtPayloadDto,
    @Body() createUserInterestDto: CreateUserInterestDto,
  ) {
    return this.userInterestService.create(user.userId, createUserInterestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all interests for the current user' })
  @ApiResponse({ status: 200, description: 'Interests retrieved successfully' })
  findAll(@CurrentUser() user: jwtPayloadDto) {
    return this.userInterestService.findAll(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific interest by ID' })
  @ApiResponse({ status: 200, description: 'Interest retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  findOne(@CurrentUser() user: jwtPayloadDto, @Param('id') id: string) {
    return this.userInterestService.findOne(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOperation({ summary: 'Update a specific interest' })
  @ApiResponse({ status: 200, description: 'Interest updated successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - category already exists',
  })
  update(
    @CurrentUser() user: jwtPayloadDto,
    @Param('id') id: string,
    @Body() updateUserInterestDto: UpdateUserInterestDto,
  ) {
    return this.userInterestService.update(
      user.userId,
      id,
      updateUserInterestDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a specific interest' })
  @ApiResponse({ status: 200, description: 'Interest removed successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  remove(@CurrentUser() user: jwtPayloadDto, @Param('id') id: string) {
    return this.userInterestService.remove(user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('category/:category')
  @ApiOperation({ summary: 'Remove interest by category name' })
  @ApiResponse({ status: 200, description: 'Interest removed successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  removeByCategory(
    @CurrentUser() user: jwtPayloadDto,
    @Param('category') category: string,
  ) {
    return this.userInterestService.removeByCategory(user.userId, category);
  }
}
