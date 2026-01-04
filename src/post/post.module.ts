import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { FileUploadService } from '../common/file-upload.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PostController],
  providers: [PostService, FileUploadService],
  exports: [PostService],
})
export class PostModule {}
