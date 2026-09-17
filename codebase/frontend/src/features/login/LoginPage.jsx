import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { apiClient } from '../../api/createApiClient';
import { ROLE_HOME } from '../../auth/access';
import { useAuth } from '../../auth/useAuth';

const roleIcons = { leader: '👑', member: '👤', coach: '👨‍🏫' };

export function LoginPage() {
  const { user, status, login, dataSource } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (dataSource === 'mock') {
      apiClient.getDemoAccounts().then((items) => {
        setAccounts(items);
        setSelectedId(items[0]?.accountId ?? '');
        setEmail(items[0]?.email ?? '');
      });
    }
  }, [dataSource]);

  if (status === 'ready' && user) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const authenticatedUser = await login({
        accountId: selectedId || undefined,
        email: form.get('email'),
        password: form.get('password'),
      });
      const requestedPath = location.state?.from;
      navigate(requestedPath || ROLE_HOME[authenticatedUser.role], { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  const chooseDemoAccount = (account) => {
    setSelectedId(account.accountId);
    setEmail(account.email);
    setPassword('');
    setError('');
  };

  return (
    <main className="official-login-page">
      <div className="official-login-background" aria-hidden="true" />
      <div className="official-login-overlay" aria-hidden="true" />

      <header className="official-login-header">
        <a className="official-brand" href="https://vlearn.dev/welcome" aria-label="VLearn — Trang chủ">
          <img src="/logo.png" alt="" />
          <span><b>V</b>Learn</span>
        </a>
        <div className="official-header-actions" aria-label="Tiện ích VLearn">
          <button type="button" title="Báo lỗi tài khoản">⚑</button>
          <button type="button" title="Switch to English">VI</button>
          <button type="button" title="Chuyển giao diện tối">◔</button>
        </div>
      </header>

      <section className="official-login-hero" aria-label="Giới thiệu VLearn">
        <h1>Học để hiểu, không chỉ<br />để trả lời.</h1>
        <p>VLearn giúp bạn học theo từng ngày, hỏi tutor ngay trên tài liệu và<br />luyện đúng knowledge component còn yếu.</p>
        <blockquote>“Chỗ nào em yếu, hệ thống biết và báo đúng chỗ đó.”</blockquote>
      </section>

      <p className="official-login-copyright">© 2026 VLearn · VinUni AI Thực Chiến. Adaptive Learning Platform.</p>

      <section className="official-login-stage" aria-labelledby="login-title">
        <div className="official-login-stack">
          <div className="official-login-card">
            <h1 id="login-title">CHÀO MỪNG <span>TRỞ LẠI</span></h1>
            <p>Đăng nhập bằng tài khoản được cấp để tiếp tục</p>

            <form onSubmit={handleSubmit} className="official-login-form">
              <label>
                <span>Email đăng nhập</span>
                <input
                  name="email"
                  type="email"
                  placeholder="email@vinuni.edu.vn"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (dataSource === 'mock') setSelectedId('');
                  }}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                <span className="password-label">Mật khẩu<a href="https://vlearn.dev/forgot-password">Quên mật khẩu?</a></span>
                <span className="password-field">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required={dataSource !== 'mock'}
                  />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPassword ? '◉' : '◉'}
                  </button>
                </span>
              </label>

              <label className="remember-row">
                <input type="checkbox" name="remember_email" defaultChecked />
                <span>Ghi nhớ email của tôi</span>
              </label>

              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="official-submit-button" disabled={status === 'loading' || !email}>
                {status === 'loading' ? 'Đang đăng nhập…' : <>Đăng nhập hệ thống <span>→</span></>}
              </button>
            </form>

            <footer className="official-login-footer">
              <button type="button" aria-expanded={showDemoAccounts} onClick={() => setShowDemoAccounts((current) => !current)}>ĐĂNG NHẬP LẦN ĐẦU?</button>
              <a href="mailto:admin@vlearn.dev">✉ &nbsp; HỖ TRỢ</a>
            </footer>

            {dataSource === 'mock' && showDemoAccounts && (
              <div className="demo-account-picker">
                <div><b>Tài khoản demo theo vai trò</b><span>Không sử dụng dữ liệu thật</span></div>
                <div className="demo-role-chips">
                  {accounts.map((account) => (
                    <button
                      type="button"
                      key={account.id}
                      className={selectedId === account.accountId ? 'active' : ''}
                      aria-pressed={selectedId === account.accountId}
                      onClick={() => {
                        chooseDemoAccount(account);
                        setShowDemoAccounts(false);
                      }}
                      title={`${account.displayName} · ${account.roleLabel}`}
                    >
                      <span>{roleIcons[account.role]}</span> {account.roleLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
