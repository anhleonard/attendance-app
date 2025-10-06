import { Injectable, Inject, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { AlsStore } from '../../utils/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AlsMiddleware implements NestMiddleware {
  constructor(
    @Inject(AsyncLocalStorage)
    private readonly als: AsyncLocalStorage<AlsStore>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const store: AlsStore = {
      requestId: req.headers['x-request-id']?.toString() || uuidv4(),
    };
    this.als.run(store, () => {
      next();
    });
  }
} 