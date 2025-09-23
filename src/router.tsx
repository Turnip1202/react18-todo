import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// 路由懒加载，减小首屏体积
const TodosPage = lazy(() => import('./views/TodosPage.tsx'));
const SettingsPage = lazy(() => import('./views/SettingsPage.tsx'));
const Layout = lazy(() => import('./views/Layout.tsx'));

const withLayout = (element: React.ReactNode) => (
  <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
    <Layout>{element}</Layout>
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: withLayout(<TodosPage />),
  },
  {
    path: '/settings',
    element: withLayout(<SettingsPage />),
  },
],{
  basename:"/react18-todo"
});

export default router;


