import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, homePathFor } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './routes/guards';
import { Spinner, Card } from './components/ui';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import VerifyEmail from './pages/auth/VerifyEmail';
import EmployeeLayout from './layouts/EmployeeLayout';
import AdminLayout from './layouts/AdminLayout';
import EmployeeDashboard from './pages/employee/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import EmployeeProfile from './pages/employee/Profile';
import Directory from './pages/admin/Directory';
import EmployeeDetail from './pages/admin/EmployeeDetail';
import EmployeeAttendance from './pages/employee/Attendance';
import AttendanceRecords from './pages/admin/AttendanceRecords';

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}

function ComingSoon({ title }) {
  return (
    <Card>
      <h1 className="font-semibold text-slate-700">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">This module arrives in an upcoming sprint.</p>
    </Card>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute role="employee" />}>
            <Route path="/app" element={<EmployeeLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="profile" element={<EmployeeProfile />} />
              <Route path="attendance" element={<EmployeeAttendance />} />
              <Route path="leave" element={<ComingSoon title="Leave" />} />
              <Route path="payroll" element={<ComingSoon title="Salary" />} />
            </Route>
          </Route>
          <Route element={<RoleRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="employees" element={<Directory />} />
              <Route path="employees/:userId" element={<EmployeeDetail />} />
              <Route path="attendance" element={<AttendanceRecords />} />
              <Route path="leaves" element={<ComingSoon title="Leave Approvals" />} />
              <Route path="payroll" element={<ComingSoon title="Payroll" />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
