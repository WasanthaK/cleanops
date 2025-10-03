/**
 * Middleware that logs any provided Idempotency-Key headers for audit trails.
 */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IdempotencyLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Idempotency');

  use(req: Request, _: Response, next: NextFunction): void {
    const key = req.headers['idempotency-key'];
    if (key) {
      this.logger.log(`Idempotency-Key received: ${key}`);
    }
    next();
  }
}
