import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'zh' | 'en';

type Dict = Record<string, string>;

const resources: Record<Lang, Dict> = {
  zh: {
    app_title: '待办清单',
    nav_todos: '任务',
    nav_settings: '设置',
    loading: '加载中...',
    empty: '暂无任务',
    add_placeholder: '添加任务...',
    add: '添加',
    clear_completed: '清除已完成',
    stats: '共 {total}，已完成 {done}',
    filter_all: '全部',
    filter_active: '未完成',
    filter_completed: '已完成',
    settings_title: '设置',
    settings_current_store: '当前存储：{name}',
    use_indexeddb: '使用 IndexedDB',
    use_localstorage: '使用 LocalStorage',
    switch_hint: '切换时会自动迁移现有数据。',
    delete: '删除',
    search: '搜索',
    priority: '优先级',
    priority_low: '低',
    priority_normal: '中',
    priority_high: '高',
    due_date: '截止日期',
    tags: '标签',
    description: '描述',
    create: '创建',
    edit: '高级编辑',
    save: '保存',
    cancel: '取消',
    actions: '操作',
    status: '状态',
    status_all: '全部',
    status_active: '未完成',
    status_completed: '已完成',
    sort: '排序',
    sort_created: '创建时间',
    sort_due: '截止日期',
    sort_priority: '优先级',
    batch_complete: '批量完成',
    batch_delete: '批量删除',
  },
  en: {
    app_title: 'Todo List',
    nav_todos: 'Todos',
    nav_settings: 'Settings',
    loading: 'Loading...',
    empty: 'No items yet',
    add_placeholder: 'Add a task...',
    add: 'Add',
    clear_completed: 'Clear completed',
    stats: '{total} total, {done} done',
    filter_all: 'All',
    filter_active: 'Active',
    filter_completed: 'Completed',
    settings_title: 'Settings',
    settings_current_store: 'Current storage: {name}',
    use_indexeddb: 'Use IndexedDB',
    use_localstorage: 'Use LocalStorage',
    switch_hint: 'Switching will migrate existing data automatically.',
    delete: 'Delete',
    search: 'Search',
    priority: 'Priority',
    priority_low: 'Low',
    priority_normal: 'Normal',
    priority_high: 'High',
    due_date: 'Due Date',
    tags: 'Tags',
    description: 'Description',
    create: 'Create',
    edit: 'Advanced Edit',
    save: 'Save',
    cancel: 'Cancel',
    actions: 'Actions',
    status: 'Status',
    status_all: 'All',
    status_active: 'Active',
    status_completed: 'Completed',
    sort: 'Sort',
    sort_created: 'Created',
    sort_due: 'Due Date',
    sort_priority: 'Priority',
    batch_complete: 'Complete Selected',
    batch_delete: 'Delete Selected',
  },
};

interface I18nContextValue {
  lang: Lang;
  t: (key: keyof typeof resources['zh'], vars?: Record<string, string | number>) => string;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LS_LANG = 'i18n:lang';

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(LS_LANG) as Lang | null;
    if (saved === 'zh' || saved === 'en') return saved;
    const nav = navigator.language.toLowerCase();
    return nav.startsWith('zh') ? 'zh' : 'en';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS_LANG, l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback<I18nContextValue['t']>((key, vars) => {
    const msg = resources[lang][key] ?? key;
    if (!vars) return msg;
    return Object.keys(vars).reduce((acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]!)), msg);
  }, [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, t, setLang }), [lang, t, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


