import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/app/layouts/app-layout';
import { AuthLayout } from '@/app/layouts/auth-layout';
import { DashboardLayout } from '@/app/layouts/dashboard-layout';
import { GuestOnlyRoute, ProtectedRoute } from '@/app/router/protected-route';
import { ForbiddenPage } from '@/components/feedback/forbidden-page';
import { LoadingScreen } from '@/components/feedback/loading-screen';
import { NotFoundPage } from '@/components/feedback/not-found-page';
import { ROUTES } from '@/constants/app';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/login-page').then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/forgot-password-page').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const DashboardOverviewPage = lazy(() =>
  import('@/features/dashboard/pages/overview-page').then((m) => ({ default: m.OverviewPage })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading application..." />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

          <Route element={<GuestOnlyRoute />}>
            <Route
              path={ROUTES.LOGIN}
              element={
                <AuthLayout
                  title="Welcome back"
                  subtitle="Enter your credentials to access the dashboard."
                >
                  <LoginPage />
                </AuthLayout>
              }
            />
            <Route
              path={ROUTES.FORGOT_PASSWORD}
              element={
                <AuthLayout
                  title="Reset your password"
                  subtitle="We will email you a recovery link."
                >
                  <ForgotPasswordPage />
                </AuthLayout>
              }
            />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardLayout />}>
              <Route index element={<DashboardOverviewPage />} />
              <Route path="*" element={<DashboardOverviewPage />} />
            </Route>
          </Route>

          <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
