import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { PowerSyncProvider } from '@/lib/powersync/PowerSyncProvider';
import { AdminPage } from '@/pages/AdminPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ShowroomPage } from '@/pages/ShowroomPage';

export default function App() {
  return (
    <PowerSyncProvider>
      <BrowserRouter>
        <AppHeader />
        <main className="container" style={{ paddingTop: 24, paddingBottom: 64 }}>
          <Routes>
            <Route path="/" element={<ShowroomPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </PowerSyncProvider>
  );
}
