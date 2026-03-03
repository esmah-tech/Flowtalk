import { createBrowserRouter, Navigate } from 'react-router';
import App from './app/App';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Loading from './pages/auth/Loading';
import Settings from './pages/Settings';
import { useAuth } from './lib/AuthContext';

function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/signin" replace />;
  return <App />;
}

function SettingsRoute() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Navigate to="/signin" replace />;
  return <Settings />;
}

export const router = createBrowserRouter([
  { path: '/', element: <ProtectedRoute /> },
  { path: '/settings', element: <SettingsRoute /> },
  { path: '/signin', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/loading', element: <Loading /> },
]);
