import { BrowserRouter } from 'react-router-dom';

import { AppRouter } from './routes';

export function AppRouterProvider() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
