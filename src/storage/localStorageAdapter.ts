import type { CreateTodoInput, Id, StorageAdapter, TodoItem, UpdateTodoInput } from '../types';

const LS_KEY = 'todos:v1';

function read(): TodoItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as TodoItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function write(items: TodoItem[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local-storage' as const;

  async init(): Promise<void> {}

  async getAll(): Promise<TodoItem[]> {
    return read();
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
    const items = read();
    items.unshift(item);
    write(items);
    return item;
  }

  async update(id: Id, input: UpdateTodoInput): Promise<TodoItem> {
    const items = read();
    const idx = items.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Item not found');
    const updated: TodoItem = {
      ...items[idx],
      ...input,
      title: input.title !== undefined ? input.title.trim() : items[idx].title,
      description: input.description !== undefined ? input.description.trim() : items[idx].description,
      tags: input.tags !== undefined ? input.tags : items[idx].tags,
      updatedAt: Date.now(),
    };
    items[idx] = updated;
    write(items);
    return updated;
  }

  async remove(id: Id): Promise<void> {
    const items = read();
    const next = items.filter(t => t.id !== id);
    write(next);
  }

  async replaceAll(items: TodoItem[]): Promise<void> {
    write(items);
  }

  async clear(): Promise<void> {
    write([]);
  }
}


