import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="screen-center">
      <p className="eyebrow">404 · VLEARN LABSPACE</p>
      <h1>Không tìm thấy trang</h1>
      <Link className="primary-button" to="/">Quay lại</Link>
    </main>
  );
}

