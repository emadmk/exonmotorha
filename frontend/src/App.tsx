import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Pages
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { RequestForm } from './pages/RequestForm';
import { AdminDashboard } from './pages/AdminDashboard';
import { TechnicianDashboard } from './pages/TechnicianDashboard';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage';

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'technician') return <Navigate to="/technician" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Success Page
function SuccessPage() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="glass-card p-8 text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">درخواست ثبت شد!</h1>
        <p className="text-dark-400 mb-6">
          سفارش شما با موفقیت ثبت شد. به زودی با شما تماس می‌گیریم.
        </p>
        <a href="/dashboard" className="btn-primary inline-block">
          مشاهده داشبورد
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const { fetchUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      fetchUser();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/success" element={<SuccessPage />} />

        {/* Customer Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ReceiptsPage />
            </ProtectedRoute>
          }
        />

        {/* Technician Routes */}
        <Route
          path="/technician"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/*"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminOrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
