import { openDB, type IDBPDatabase } from 'idb';
import type { CreateTodoInput, Id, StorageAdapter, TodoItem, UpdateTodoInput } from '../types';
import { DB_CONSTANTS } from '../types';

type TodoDB = IDBPDatabase<unknown>;

/** IndexedDB 适配器：大数据量下更可靠且异步不阻塞主线程 */
export class IndexedDbAdapter implements StorageAdapter {
  readonly name = 'indexed-db' as const;
  private db: TodoDB | null = null;

  private async getDb(): Promise<TodoDB> {
    if (this.db) return this.db;
    this.db = await openDB(DB_CONSTANTS.dbName, DB_CONSTANTS.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_CONSTANTS.storeName)) {
          const store = db.createObjectStore(DB_CONSTANTS.storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('updatedAt', 'updatedAt');
          store.createIndex('completed', 'completed');
          store.createIndex('priority', 'priority');
          store.createIndex('dueDate', 'dueDate');
        }
      },
    });
    return this.db;
  }

  async init(): Promise<void> {
    await this.getDb();
  }

  async getAll(): Promise<TodoItem[]> {
    const db = await this.getDb();
    const tx = db.transaction(DB_CONSTANTS.storeName, 'readonly');
    const store = tx.objectStore(DB_CONSTANTS.storeName);
    const all = await store.getAll();
    const items = (all as TodoItem[]).sort((a, b) => b.createdAt - a.createdAt);
    await tx.done;
    return items;
  }

  async create(input: CreateTodoInput): Promise<TodoItem> {
    const now = Date.now();
    const item: TodoItem = {
      id: crypto.randomUUID?.() ?? `${now}-${Math.random()}`,
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      priority: input.priority ?? 'normal',
      dueDate: input.dueDate ?? null,
      tags: input.tags ?? [],
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    const db = await this.getDb();
    const tx = db.transaction(DB_CONSTANTS.storeName, 'readwrite');
    await tx.store.add(item);
    await tx.done;
    return item;
  }

  async update(id: Id, input: UpdateTodoInput): Promise<TodoItem> {
    const db = await this.getDb();
    const tx = db.transaction(DB_CONSTANTS.storeName, 'readwrite');
    const prev = (await tx.store.get(id)) as TodoItem | undefined;
    if (!prev) {
      await tx.done;
      throw new Error('Item not found');
    }
    const updated: TodoItem = {
      ...prev,
      ...input,
      title: input.title !== undefined ? input.title.trim() : prev.title,
      description: input.description !== undefined ? input.description.trim() : prev.description,
      tags: input.tags !== undefined ? input.tags : prev.tags,
      updatedAt: Date.now(),
    };
    await tx.store.put(updated);
    await tx.done;
    return updated;
  }

  async remove(id: Id): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(DB_CONSTANTS.storeName, 'readwrite');
    await tx.store.delete(id);
    await tx.done;
  }

  async replaceAll(items: TodoItem[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(DB_CONSTANTS.storeName, 'readwrite');
    await tx.store.clear();
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(DB_CONSTANTS.storeName, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
}


