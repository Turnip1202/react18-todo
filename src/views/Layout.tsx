import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { Layout as AntLayout, Menu, theme as antdTheme, ConfigProvider, Segmented, Space, Grid } from 'antd';
import { CheckSquareOutlined, SettingOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/i18n';

/** 基础布局：顶部导航 + 内容容器（优雅配色 & 响应式） */
const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { t } = useI18n();
  const { Header, Content } = AntLayout;
  const location = useLocation();
  const navigate = useNavigate();
  const selected = location.pathname.startsWith('/settings') ? ['/settings'] : ['/'];

  // 主题切换（黑/白）
  const THEME_KEY = 'ui:theme';
  const [themeMode, setThemeMode] = useState<'dark'|'light'>(() => (localStorage.getItem(THEME_KEY) as 'dark'|'light') || 'dark');
  useEffect(() => { localStorage.setItem(THEME_KEY, themeMode); }, [themeMode]);
  const themeConfig = useMemo(() => ({ algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }), [themeMode]);

  // 内部组件，位于 ConfigProvider 之下，可安全读取 token
  const TopBar: React.FC = () => {
    const { token } = antdTheme.useToken();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    return (
      <Header style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: 12, background: token.colorBgContainer, color: token.colorText, borderBottom: `1px solid ${token.colorBorderSecondary}`, flexWrap: 'wrap' }}>
        <div style={{ marginRight: 8, fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>
          <Link to="/" style={{ color: 'inherit' }}>{t('app_title')}</Link>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Menu
            theme={themeMode === 'dark' ? 'dark' : 'light'}
            mode="horizontal"
            selectedKeys={selected}
            onClick={({ key }) => navigate(String(key))}
            style={{ background: 'transparent', borderBottom: 'none', width: isMobile ? '100%' : 'auto' }}
            items={[
              { key: '/', icon: <CheckSquareOutlined />, label: t('nav_todos') },
              { key: '/settings', icon: <SettingOutlined />, label: t('nav_settings') },
            ]}
          />
        </div>
        <Space>
          <Segmented
            value={themeMode}
            onChange={(v)=>setThemeMode(v as any)}
            options={[
              { label: <MoonOutlined />, value: 'dark' },
              { label: <SunOutlined />, value: 'light' },
            ]}
          />
        </Space>
      </Header>
    );
  };
  return (
    <ConfigProvider theme={themeConfig}>
      <AntLayout style={{ minHeight: '100dvh' }}>
        <TopBar />
        <Content style={{ maxWidth: 1024, margin: '0 auto', padding: 12 }}>
          {children ?? <Outlet />}
        </Content>
      </AntLayout>
    </ConfigProvider>
  );
};

export default Layout;


