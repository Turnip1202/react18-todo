import './App.css';
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.tsx';
import { I18nProvider } from './i18n/i18n';

// 应用入口：提供路由
const App: React.FC = () => {
  return (
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  );
};

export default App;
