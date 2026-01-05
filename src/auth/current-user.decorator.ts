/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { jwtPayloadDto } from './dto/jwtPayload.dto';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as jwtPayloadDto;

    // If a specific field is requested, return that field
    if (data && user) {
      return user[data as keyof jwtPayloadDto];
    }

    // Otherwise return the entire user object
    return user;
  },
);
