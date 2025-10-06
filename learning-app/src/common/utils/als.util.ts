import { AsyncLocalStorage } from 'async_hooks';
import { AlsStore } from '../../utils/interfaces';

// Global instance that will be set by the AlsModule
let alsInstance: AsyncLocalStorage<AlsStore> | null = null;

export function setAlsInstance(instance: AsyncLocalStorage<AlsStore>) {
  alsInstance = instance;
}

export function getAlsStore(): AlsStore | undefined {
  return alsInstance?.getStore();
}

export function getRequestId(): string {
  const store = getAlsStore();
  return store?.requestId || 'unknown';
} 