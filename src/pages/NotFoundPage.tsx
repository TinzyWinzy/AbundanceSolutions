import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <h3>Page not found</h3>
      <p>
        <Link to="/">Return home</Link>
      </p>
    </div>
  );
}
