import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { loadUser } from './store/slices/authSlice';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentProfileSetup from './pages/student/ProfileSetup';
import AvailableDrives from './pages/student/AvailableDrives';
import MyApplications from './pages/student/MyApplications';


// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/Dashboard';
import CompanyProfile from './pages/recruiter/CompanyProfile';
import PostDrive from './pages/recruiter/PostDrive';
import ManageDrives from './pages/recruiter/ManageDrives';
import Applicants from './pages/recruiter/Applicants';
import Shortlisted from './pages/recruiter/Shortlisted';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentsManagement from './pages/admin/StudentsManagement';
import RecruiterManagement from './pages/admin/RecruiterManagement';
import DrivesManagement from './pages/admin/DrivesManagement';
import AdminStatistics from './pages/admin/Statistics';
import BatchesManagement from './pages/admin/BatchesManagement';

// Shared Pages
import Notifications from './pages/shared/Notifications';
import Settings from './pages/shared/Settings';

function AppContent() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector(state => state.theme);
  const { initialLoading } = useSelector(state => state.auth);

  // Restore auth session from JWT on app mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Show loading only during initial JWT session verification
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="text-surface-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 transition-colors">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Student Profile Setup Route (Distraction-free, no sidebar) */}
            <Route path="/student/profile-setup" element={
              <ProtectedRoute allowedRole="student"><StudentProfileSetup /></ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRole="student"><DashboardLayout /></ProtectedRoute>
            }>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="drives" element={<AvailableDrives />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Recruiter Routes */}
            <Route path="/recruiter" element={
              <ProtectedRoute allowedRole="recruiter"><DashboardLayout /></ProtectedRoute>
            }>
              <Route path="dashboard" element={<RecruiterDashboard />} />
              <Route path="profile" element={<CompanyProfile />} />
              <Route path="post-drive" element={<PostDrive />} />
              <Route path="drives" element={<ManageDrives />} />
              <Route path="applicants" element={<Applicants />} />
              <Route path="shortlisted" element={<Shortlisted />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRole="admin"><DashboardLayout /></ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<StudentsManagement />} />
              <Route path="recruiters" element={<RecruiterManagement />} />
              <Route path="drives" element={<DrivesManagement />} />
              <Route path="batches" element={<BatchesManagement />} />
              <Route path="statistics" element={<AdminStatistics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
