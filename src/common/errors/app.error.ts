import { HttpStatus } from '@nestjs/common';

export class AppError extends Error {
    constructor(
        public readonly message: string,
        public readonly statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
        public readonly details?: any
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}