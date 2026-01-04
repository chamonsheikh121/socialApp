import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InterestService } from './interest.service';
import {
  CreateInterestDto,
  UpdateInterestDto,
} from './dto/create-interest.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Interests')
@ApiBearerAuth()
@Controller('interests')
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new interest' })
  @ApiResponse({ status: 201, description: 'Interest created successfully' })
  @ApiResponse({ status: 400, description: 'Interest already exists' })
  create(@Body() createInterestDto: CreateInterestDto) {
    return this.interestService.create(createInterestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all interests' })
  @ApiResponse({ status: 200, description: 'Interests retrieved successfully' })
  findAll() {
    return this.interestService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get interest by ID' })
  @ApiResponse({ status: 200, description: 'Interest retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  findOne(@Param('id') id: string) {
    return this.interestService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update interest' })
  @ApiResponse({ status: 200, description: 'Interest updated successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  update(
    @Param('id') id: string,
    @Body() updateInterestDto: UpdateInterestDto,
  ) {
    return this.interestService.update(id, updateInterestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete interest' })
  @ApiResponse({ status: 200, description: 'Interest removed successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  remove(@Param('id') id: string) {
    return this.interestService.remove(id);
  }
}
