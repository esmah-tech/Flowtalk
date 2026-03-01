import { createBrowserRouter } from 'react-router';
import App from './app/App';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Loading from './pages/auth/Loading';

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/signin', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/loading', element: <Loading /> },
]);
