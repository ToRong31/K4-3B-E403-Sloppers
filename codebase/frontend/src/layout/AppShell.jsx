import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';
import { useRealtime } from '../realtime/useRealtime';

const navItems = [
  { to: '/labs', label: 'Lab', icon: '⚗', roles: ['leader', 'member'] },
  { to: '/workspace', label: 'LabSpace', icon: '◫', roles: ['leader', 'member'] },
  { to: '/coach', label: 'Tiến độ nhóm', icon: '▦', roles: ['coach'] },
];

export function AppShell() {
  const { user, logout, dataSource } = useAuth();
  const { status: realtimeStatus } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const isCourseReader = /^\/labs\/[^/]+/.test(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (isCourseReader) return <Outlet />;

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink className="brand" to={user.role === 'coach' ? '/coach' : '/labs'}>
          <img src="/logo.png" alt="VLearn" />
          <span><b>V</b>Learn</span>
        </NavLink>

        <nav className="main-nav" aria-label="Điều hướng chính">
          {navItems
            .filter((item) => item.roles.includes(user.role))
            .map((item) => (
              <NavLink key={item.to} to={item.to}>
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="header-tools">
          {dataSource === 'mock' && <span className="environment-badge">DỮ LIỆU MÔ PHỎNG</span>}
          <span className={`connection-pill ${realtimeStatus}`}>
            <i /> {realtimeStatus === 'connected' ? 'Real-time' : realtimeStatus}
          </span>
          <div className="account-chip">
            <span className="avatar">{user.avatar}</span>
            <span><b>{user.shortName}</b><small>{user.roleLabel}</small></span>
          </div>
          <button className="text-button" type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
