import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { InstallPrompt } from '@/components/layout/InstallPrompt';
import { PowerSyncProvider } from '@/lib/powersync/PowerSyncProvider';
import { AdminPage } from '@/pages/AdminPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { StorePage } from '@/pages/StorePage';

export default function App() {
  return (
    <PowerSyncProvider>
      <BrowserRouter>
        <AppHeader />
        <main className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/:id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/showroom" element={<Navigate to="/store" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <InstallPrompt />
      </BrowserRouter>
    </PowerSyncProvider>
  );
}
