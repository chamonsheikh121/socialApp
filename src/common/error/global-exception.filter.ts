/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: PinoLogger | Console;

  constructor();
  constructor(logger?: PinoLogger);
  constructor(logger?: PinoLogger) {
    this.logger = logger || console;
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || error;
      }
    } else if (exception instanceof Error) {
      // Handle custom AppError
      if (exception.name === 'AppError') {
        const appError = exception as any;
        status = appError.code || HttpStatus.BAD_REQUEST;
        message = appError.message;
        error = 'Bad Request';
      } else {
        // Handle other errors
        message = exception.message || message;
      }
    }

    // Log the error
    if (this.logger === console) {
      console.error(`HTTP ${status} Error:`, {
        status,
        error,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
        url: (request as any).url,
        method: (request as any).method,
        userAgent: (request as any).headers?.['user-agent'],
        ip: (request as any).ip || (request as any).connection?.remoteAddress,
      });
    } else {
      (this.logger as PinoLogger).error(
        {
          status,
          error,
          message,
          stack: exception instanceof Error ? exception.stack : undefined,
          url: (request as any).url,
          method: (request as any).method,
          userAgent: (request as any).headers?.['user-agent'],
          ip: (request as any).ip || (request as any).connection?.remoteAddress,
        },
        `HTTP ${status} Error`,
      );
    }

    // Send error response
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
    });
  }
}
