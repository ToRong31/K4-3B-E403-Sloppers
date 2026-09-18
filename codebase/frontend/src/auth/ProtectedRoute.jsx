import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { canAccess, ROLE_HOME } from './access';
import { useAuth } from './useAuth';

export function ProtectedRoute({ allowedRoles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <main className="screen-center" aria-live="polite">
        <div className="loader" />
        <p>Đang khôi phục phiên đăng nhập…</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!canAccess(user.role, allowedRoles)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/login'} replace />;
  }

  return <Outlet />;
}

