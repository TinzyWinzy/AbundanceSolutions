import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/admin/Dashboard';
import { Spinner } from '@/components/ui/States';

export function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <h3>Access restricted</h3>
        <p>Your account does not have admin access.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Field operations</h1>
      <Dashboard />
    </div>
  );
}
