import { HttpStatus } from '@nestjs/common';

export class AppError extends Error {
  constructor(
    public code: number = HttpStatus.INTERNAL_SERVER_ERROR,
    public message: string,
    public error?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Common error classes
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(HttpStatus.BAD_REQUEST, message, 'Bad Request');
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, message, 'Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(HttpStatus.FORBIDDEN, message, 'Forbidden');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(HttpStatus.NOT_FOUND, message, 'Not Found');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(HttpStatus.CONFLICT, message, 'Conflict');
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Failed') {
    super(HttpStatus.BAD_REQUEST, message, 'Validation Failed');
    this.name = 'ValidationError';
  }
}
