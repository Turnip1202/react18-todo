import type { AdapterKind, StorageAdapter } from '../types';
import { LocalStorageAdapter } from './localStorageAdapter';
import { IndexedDbAdapter } from './indexedDbAdapter';

/** 工厂：根据设置创建适配器实例 */
export function createStorageAdapter(kind: AdapterKind): StorageAdapter {
  if (kind === 'local-storage') return new LocalStorageAdapter();
  return new IndexedDbAdapter();
}


