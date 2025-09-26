import React, { useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Button, DatePicker, Form, Input, Modal, Popconfirm, Radio, Select, Space, Table, Tag, Typography, App as AntApp, Collapse, Grid, Checkbox, List, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, SearchOutlined, MoreOutlined, EyeOutlined } from '@ant-design/icons';
import { useTodos } from '../hooks/useTodos';
import { useI18n } from '../i18n/i18n';
import type { Priority, TodoItem } from '../types';

const priorityColor: Record<Priority, string> = { low: 'default', normal: 'blue', high: 'red' } as const;

const TodosPage: React.FC = () => {
  const { loading, items, add, update, remove, clearCompleted } = useTodos();
  const { t } = useI18n();
  const { message } = AntApp.useApp?.() ?? { message: { success: () => {} } } as any;

  // 查询/过滤/排序
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all'|'active'|'completed'>('all');
  const [sort, setSort] = useState<'created'|'due'|'priority'>('created');

  // 选择与编辑
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [viewing, setViewing] = useState<TodoItem | null>(null);
  const [form] = Form.useForm();
  const createFormRef = useRef<any>(null);

  const filtered = useMemo(() => {
    let data = items;
    if (status === 'active') data = data.filter(i => !i.completed);
    if (status === 'completed') data = data.filter(i => i.completed);
    if (q.trim()) {
      const kw = q.trim().toLowerCase();
      data = data.filter(i => i.title.toLowerCase().includes(kw) || i.description.toLowerCase().includes(kw) || i.tags.some(t => t.toLowerCase().includes(kw)));
    }
    const sorted = [...data];
    if (sort === 'created') sorted.sort((a,b)=> b.createdAt - a.createdAt);
    if (sort === 'due') sorted.sort((a,b)=> (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity));
    if (sort === 'priority') {
      const order: Record<Priority, number> = { high: 0, normal: 1, low: 2 };
      sorted.sort((a,b)=> order[a.priority]-order[b.priority]);
    }
    return sorted;
  }, [items, q, status, sort]);

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const columns: ColumnsType<TodoItem> = [
    {
      title: t('nav_todos'),
      dataIndex: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text delete={record.completed}>{text}</Typography.Text>
          {record.description && <Typography.Paragraph type="secondary" style={{ margin: 0 }} ellipsis={{ rows: 2 }}>{record.description}</Typography.Paragraph>}
        </Space>
      )
    },
    {
      title: t('priority'),
      dataIndex: 'priority',
      width: 120,
      render: (p: Priority) => <Tag color={priorityColor[p]}>{p === 'low' ? t('priority_low') : p === 'high' ? t('priority_high') : t('priority_normal')}</Tag>
    },
    {
      title: t('due_date'),
      dataIndex: 'dueDate',
      width: 160,
      render: (ts: number | null) => ts ? dayjs(ts).format('YYYY-MM-DD') : '-'
    },
    {
      title: t('tags'),
      dataIndex: 'tags',
      width: 200,
      render: (tags: string[]) => <Space wrap>{tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</Space>
    },
    {
      title: t('status'),
      dataIndex: 'completed',
      width: 120,
      render: (v: boolean, r) => (
        <Button size="small" type={v ? 'default' : 'primary'} icon={<CheckCircleOutlined />} onClick={()=>update(r.id, { completed: !v })}>
          {v ? t('filter_completed') : t('filter_active')}
        </Button>
      )
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={()=>{ setEditing(record); form.setFieldsValue({
            title: record.title,
            description: record.description,
            priority: record.priority,
            dueDate: record.dueDate ? dayjs(record.dueDate) : null,
            tags: record.tags,
          }); }}>
            {t('edit')}
          </Button>
          <Popconfirm title={t('delete')} onConfirm={()=>remove(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>{t('delete')}</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={isMobile ? 12 : 16}>
      {/* 创建表单 */}
      <Form layout="vertical" onFinish={async (values)=>{
        await add({
          title: values.title,
          description: values.description?.trim() || '',
          priority: values.priority ?? 'normal',
          dueDate: values.dueDate ? dayjs(values.dueDate).valueOf() : null,
          tags: values.tags ?? [],
        });
        message?.success?.(t('create'));
        createFormRef.current?.resetFields?.();
      }} ref={createFormRef}>
        <Form.Item name="title" label={t('add')} rules={[{ required: true }]}>
          <Input placeholder={t('add_placeholder')} allowClear />
        </Form.Item>
        <Collapse size="small" items={[{
          key: 'advanced',
          label: t('edit'),
          children: (
            <Space wrap>
              <Form.Item name="priority" label={t('priority')} initialValue={'normal'}>
                <Select style={{ width: 160 }} options={[{ value:'low', label:t('priority_low') },{ value:'normal', label:t('priority_normal') },{ value:'high', label:t('priority_high') }]} />
              </Form.Item>
              <Form.Item name="dueDate" label={t('due_date')} initialValue={dayjs()}>
                <DatePicker />
              </Form.Item>
              <Form.Item name="tags" label={t('tags')}>
                <Select mode="tags" tokenSeparators={[',',' ']} placeholder={t('tags')} style={{ minWidth: 220 }} />
              </Form.Item>
              <Form.Item name="description" label={t('description')} style={{ minWidth: 320 }}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </Space>
          )
        }]} />
        <div>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>{t('create')}</Button>
        </div>
      </Form>

      {/* 工具条：搜索、过滤、排序、批量操作 */}
      <Space wrap size={isMobile ? 8 : 12}>
        <Input allowClear prefix={<SearchOutlined />} placeholder={t('search')} value={q} onChange={e=>setQ(e.target.value)} style={{ width: isMobile ? '100%' : 240 }} />
        <Radio.Group value={status} onChange={e=>setStatus(e.target.value)} size={isMobile ? 'small' : 'middle'}>
          <Radio.Button value="all">{t('status_all')}</Radio.Button>
          <Radio.Button value="active">{t('status_active')}</Radio.Button>
          <Radio.Button value="completed">{t('status_completed')}</Radio.Button>
        </Radio.Group>
        <Space>
          <Typography.Text>{t('sort')}</Typography.Text>
          <Select value={sort} onChange={setSort} style={{ width: 160 }} options={[
            { value: 'created', label: t('sort_created') },
            { value: 'due', label: t('sort_due') },
            { value: 'priority', label: t('sort_priority') },
          ]} />
        </Space>
        <Button size={isMobile ? 'small' : 'middle'} onClick={()=>clearCompleted()}>{t('clear_completed')}</Button>
        {!isMobile && (
          <>
            <Button disabled={!selectedRowKeys.length} onClick={()=>{
              selectedRowKeys.forEach(k=>{
                const rec = items.find(i=>i.id===k);
                if (rec && !rec.completed) void update(rec.id, { completed: true });
              });
              setSelectedRowKeys([]);
            }}>{t('batch_complete')}</Button>
            <Button danger disabled={!selectedRowKeys.length} onClick={()=>{
              selectedRowKeys.forEach(k=>void remove(String(k)));
              setSelectedRowKeys([]);
            }} icon={<DeleteOutlined />}>{t('batch_delete')}</Button>
          </>
        )}
      </Space>

      {/* 列表：移动端用 List，桌面端用表格 */}
      {isMobile ? (
        <List
          dataSource={filtered}
          locale={{ emptyText: t('empty') }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{ padding: 12 }}
              actions={[
                <Button 
                  type="text" 
                  icon={<EyeOutlined />} 
                  onClick={() => setViewing(item)}
                />,
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'edit',
                        label: t('edit'),
                        icon: <EditOutlined />,
                        onClick: () => {
                          setEditing(item);
                          form.setFieldsValue({
                            title: item.title,
                            description: item.description,
                            priority: item.priority,
                            dueDate: item.dueDate ? dayjs(item.dueDate) : null,
                            tags: item.tags,
                          });
                        }
                      },
                      {
                        key: 'delete',
                        label: t('delete'),
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => remove(item.id)
                      }
                    ]
                  }}
                  trigger={['click']}
                >
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              ]}
            >
              <List.Item.Meta
                avatar={<Checkbox checked={item.completed} onChange={() => update(item.id, { completed: !item.completed })} />}
                title={
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text style={{ wordBreak: 'break-word' }} delete={item.completed}>
                      {item.title}
                    </Typography.Text>
                    {item.dueDate && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.dueDate).format('MM-DD')}
                      </Typography.Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: t('empty') }}
        />
      )}

      {/* 查看详情弹窗 */}
      <Modal
        open={!!viewing}
        title={t('nav_todos')}
        onCancel={()=>setViewing(null)}
        footer={[
          <Button key="close" onClick={()=>setViewing(null)}>
            {t('cancel')}
          </Button>
        ]}
      >
        {viewing && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">{t('nav_todos')}</Typography.Text>
              <Typography.Paragraph style={{ margin: '8px 0 0 0' }}>{viewing.title}</Typography.Paragraph>
            </div>
            {viewing.description && (
              <div>
                <Typography.Text type="secondary">{t('description')}</Typography.Text>
                <Typography.Paragraph style={{ margin: '8px 0 0 0' }}>{viewing.description}</Typography.Paragraph>
              </div>
            )}
            <div>
              <Typography.Text type="secondary">{t('priority')}</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={priorityColor[viewing.priority]}>
                  {viewing.priority === 'low' ? t('priority_low') : viewing.priority === 'high' ? t('priority_high') : t('priority_normal')}
                </Tag>
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">{t('due_date')}</Typography.Text>
              <Typography.Paragraph style={{ margin: '8px 0 0 0' }}>
                {viewing.dueDate ? dayjs(viewing.dueDate).format('YYYY-MM-DD') : '-'}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Text type="secondary">{t('tags')}</Typography.Text>
              <div style={{ marginTop: 8 }}>
                {viewing.tags.length > 0 ? (
                  <Space wrap>
                    {viewing.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">创建时间</Typography.Text>
              <Typography.Paragraph style={{ margin: '8px 0 0 0' }}>
                {dayjs(viewing.createdAt).format('YYYY-MM-DD HH:mm')}
              </Typography.Paragraph>
            </div>
            <div>
              <Typography.Text type="secondary">更新时间</Typography.Text>
              <Typography.Paragraph style={{ margin: '8px 0 0 0' }}>
                {dayjs(viewing.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Typography.Paragraph>
            </div>
          </Space>
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        open={!!editing}
        title={t('edit')}
        onCancel={()=>setEditing(null)}
        onOk={async ()=>{
          const v = await form.validateFields();
          await update(editing!.id, {
            title: v.title,
            description: v.description,
            priority: v.priority,
            dueDate: v.dueDate ? dayjs(v.dueDate).valueOf() : null,
            tags: v.tags ?? [],
          });
          setEditing(null);
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label={t('add')} rules={[{ required: true }] }>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priority" label={t('priority')} initialValue={'normal'}>
            <Select options={[
              { value: 'low', label: t('priority_low') },
              { value: 'normal', label: t('priority_normal') },
              { value: 'high', label: t('priority_high') },
            ]} />
          </Form.Item>
          <Form.Item name="dueDate" label={t('due_date')}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="tags" label={t('tags')}>
            <Select mode="tags" tokenSeparators={[',',' ']} placeholder="tags" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default TodosPage;


