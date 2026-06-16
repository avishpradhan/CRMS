import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  // Force student to set up profile if they don't have one and haven't skipped it
  if (
    role === 'student' &&
    user &&
    user.hasProfile === false &&
    location.pathname !== '/student/profile-setup' &&
    sessionStorage.getItem('bypass_profile_setup') !== 'true'
  ) {
    return <Navigate to="/student/profile-setup" replace />;
  }

  // If student has a profile and tries to go to profile-setup, redirect to dashboard
  if (
    role === 'student' &&
    user &&
    user.hasProfile === true &&
    location.pathname === '/student/profile-setup'
  ) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}
