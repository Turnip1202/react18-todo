import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AdapterKind, CreateTodoInput, Id, Settings, TodoItem, UpdateTodoInput } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { createStorageAdapter } from '../storage';

/**
 * useTodos：封装业务逻辑与持久化
 * - 适配器可切换（localStorage / IndexedDB）
 * - 利用 requestIdleCallback 降低主线程抢占
 * - 使用 BroadcastChannel 实现跨标签同步
 */
export function useTodos(initialSettings?: Partial<Settings>) {
  const settings = useMemo<Settings>(() => ({ ...DEFAULT_SETTINGS, ...initialSettings }), [initialSettings]);

  const adapterRef = useRef(createStorageAdapter(settings.adapter));
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TodoItem[]>([]);

  // 跨标签页同步
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel('todos-sync');
    channel.onmessage = (e) => {
      if (e?.data === 'refresh') void reload();
    };
    channelRef.current = channel;
    return () => channel.close();
  }, []);

  // 初始化与数据加载
  const reload = useCallback(async () => {
    setLoading(true);
    const data = await adapterRef.current.getAll();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await adapterRef.current.init();
      const doLoad = () => reload();
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          if (!cancelled) void doLoad();
        });
      } else {
        setTimeout(() => {
          if (!cancelled) void doLoad();
        }, 0);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  // 切换适配器
  const switchAdapter = useCallback(async (kind: AdapterKind) => {
    if (kind === adapterRef.current.name) return;
    const next = createStorageAdapter(kind);
    await next.init();
    const currentAll = await adapterRef.current.getAll();
    await next.replaceAll(currentAll);
    adapterRef.current = next;
    await reload();
    channelRef.current?.postMessage('refresh');
  }, [reload]);

  const add = useCallback(async (input: string | CreateTodoInput) => {
    const createInput: CreateTodoInput = typeof input === 'string'
      ? { title: input }
      : input;
    const created = await adapterRef.current.create(createInput);
    setItems(prev => [created, ...prev]);
    channelRef.current?.postMessage('refresh');
  }, []);

  const update = useCallback(async (id: Id, input: UpdateTodoInput) => {
    const updated = await adapterRef.current.update(id, input);
    setItems(prev => prev.map(t => t.id === id ? updated : t));
    channelRef.current?.postMessage('refresh');
  }, []);

  const remove = useCallback(async (id: Id) => {
    await adapterRef.current.remove(id);
    setItems(prev => prev.filter(t => t.id !== id));
    channelRef.current?.postMessage('refresh');
  }, []);

  const clearCompleted = useCallback(async () => {
    const next = items.filter(t => !t.completed);
    await adapterRef.current.replaceAll(next);
    setItems(next);
    channelRef.current?.postMessage('refresh');
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter(t => t.completed).length;
    return { total, done, todo: total - done };
  }, [items]);

  return {
    loading,
    items,
    stats,
    add,
    update,
    remove,
    clearCompleted,
    switchAdapter,
    adapterName: adapterRef.current.name,
  } as const;
}


