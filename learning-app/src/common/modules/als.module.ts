import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { AlsStore } from '../../utils/interfaces';
import { setAlsInstance } from '../utils/als.util';

@Global()
@Module({
  providers: [
    {
      provide: AsyncLocalStorage,
      useValue: new AsyncLocalStorage<AlsStore>(),
    },
  ],
  exports: [AsyncLocalStorage],
})
export class AlsModule implements OnModuleInit {
  constructor(
    private readonly als: AsyncLocalStorage<AlsStore>
  ) {}

  onModuleInit() {
    setAlsInstance(this.als);
  }
} 