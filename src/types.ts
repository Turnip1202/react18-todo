// 通用类型与枚举
export type Id = string;

export type Priority = 'low' | 'normal' | 'high';

export interface TodoItem {
  id: Id;
  title: string;
  description: string;
  priority: Priority;
  dueDate: number | null; // UTC ms
  tags: string[];
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: number | null;
  tags?: string[];
}

export type UpdateTodoInput = Partial<Pick<TodoItem,
  'title' | 'description' | 'priority' | 'dueDate' | 'tags' | 'completed'
>>;

export interface StorageAdapter {
  /** 返回适配器名称，用于设置与诊断 */
  readonly name: 'local-storage' | 'indexed-db';
  /** 初始化与资源准备 */
  init(): Promise<void>;
  /** 读取全部条目 */
  getAll(): Promise<TodoItem[]>;
  /** 新增条目，返回创建后的实体 */
  create(input: CreateTodoInput): Promise<TodoItem>;
  /** 根据 id 更新条目，返回更新后的实体 */
  update(id: Id, input: UpdateTodoInput): Promise<TodoItem>;
  /** 删除条目 */
  remove(id: Id): Promise<void>;
  /** 批量替换（用于导入/同步） */
  replaceAll(items: TodoItem[]): Promise<void>;
  /** 清空所有数据 */
  clear(): Promise<void>;
}

export type AdapterKind = StorageAdapter['name'];

export interface Settings {
  adapter: AdapterKind;
}

export const DEFAULT_SETTINGS: Settings = {
  adapter: 'indexed-db',
};

export const DB_CONSTANTS = {
  dbName: 'todoListDb',
  storeName: 'todos',
  version: 1,
} as const;

export function generateId(): Id {
  // 高质量 ID：时间戳 + 随机，避免重复
  return `${Date.now().toString(36)}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
}


