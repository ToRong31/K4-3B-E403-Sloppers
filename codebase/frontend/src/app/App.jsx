import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '../auth/ProtectedRoute';
import { useAuth } from '../auth/useAuth';
import { CoachDashboardPage } from '../features/coach/CoachDashboardPage';
import { LabsPage } from '../features/labs/LabsPage';
import { LessonPage } from '../features/lesson/LessonPage';
import { LoginPage } from '../features/login/LoginPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { WorkspacePage } from '../features/workspace/WorkspacePage';
import { AppShell } from '../layout/AppShell';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'coach' ? '/coach' : '/labs'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRedirect />} />
          <Route element={<ProtectedRoute allowedRoles={['leader', 'member']} />}>
            <Route path="/labs" element={<LabsPage />} />
            <Route path="/labs/:labId" element={<LessonPage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
            <Route path="/coach" element={<CoachDashboardPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

