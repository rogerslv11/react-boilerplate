import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppRouterProvider } from '@/app/router';
import { AppProvider } from '@/app/providers/app-provider';

import '@/styles/globals.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProvider>
      <AppRouterProvider />
    </AppProvider>
  </StrictMode>,
);
