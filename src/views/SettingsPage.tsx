import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';
import { useI18n } from '../i18n/i18n';
import { Card, Segmented, Space, Typography } from 'antd';

const SettingsPage: React.FC = () => {
  const { adapterName, switchAdapter } = useTodos();
  const { t, lang, setLang } = useI18n();
  const [pending, setPending] = useState(false);

  return (
    <Card title={t('settings_title')}>
      <Space direction="vertical" size={16}>
        <Typography.Text type="secondary">{t('settings_current_store', { name: adapterName })}</Typography.Text>
        <Segmented
          value={adapterName}
          onChange={async (v)=>{ setPending(true); await switchAdapter(v as any); setPending(false); }}
          options={[
            { label: t('use_indexeddb'), value: 'indexed-db' },
            { label: t('use_localstorage'), value: 'local-storage' },
          ]}
          disabled={pending}
        />
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>{t('switch_hint')}</Typography.Paragraph>

        <Segmented
          value={lang}
          onChange={(v)=>setLang(v as any)}
          options={[{ label:'中文', value:'zh' }, { label:'English', value:'en' }]}
        />
      </Space>
    </Card>
  );
};

export default SettingsPage;


