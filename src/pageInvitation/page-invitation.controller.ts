import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PageInvitationService } from './page-invitation.service';
import { CreatePageInvitationDto, GetPageInvitationsDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Page Invitations')
@Controller('page-invitations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PageInvitationController {
  constructor(private readonly pageInvitationService: PageInvitationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a page invitation' })
  @ApiResponse({
    status: 201,
    description: 'Page invitation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Page or user not found' })
  @ApiResponse({ status: 409, description: 'Invitation already exists' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createPageInvitationDto: CreatePageInvitationDto,
  ) {
    return this.pageInvitationService.create(userId, createPageInvitationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all page invitations with filters' })
  @ApiResponse({
    status: 200,
    description: 'Page invitations retrieved successfully',
  })
  findAll(@Query() getPageInvitationsDto: GetPageInvitationsDto) {
    return this.pageInvitationService.findAll(getPageInvitationsDto);
  }

  @Get('my-invitations')
  @ApiOperation({ summary: 'Get my pending invitations' })
  @ApiResponse({
    status: 200,
    description: 'My invitations retrieved successfully',
  })
  getMyInvitations(@CurrentUser('id') userId: string) {
    return this.pageInvitationService.getMyInvitations(userId);
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get invitations sent by me' })
  @ApiResponse({
    status: 200,
    description: 'Sent invitations retrieved successfully',
  })
  getSentInvitations(@CurrentUser('id') userId: string) {
    return this.pageInvitationService.getSentInvitations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific page invitation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Page invitation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  findOne(@Param('id') id: string) {
    return this.pageInvitationService.findOne(id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept a page invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'Already following' })
  acceptInvitation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.pageInvitationService.acceptInvitation(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a page invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  rejectInvitation(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.pageInvitationService.rejectInvitation(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a page invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.pageInvitationService.remove(id, userId);
  }
}
