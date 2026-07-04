import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, homePathFor } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './routes/guards';
import { Spinner } from './components/ui';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import VerifyEmail from './pages/auth/VerifyEmail';

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return <Navigate to={user ? homePathFor(user) : '/login'} replace />;
}

function Placeholder({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-xl font-semibold text-slate-600">{title}</h1>
    </div>
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
            <Route path="/app/*" element={<Placeholder title="Employee dashboard (Sprint 2)" />} />
          </Route>
          <Route element={<RoleRoute role="admin" />}>
            <Route path="/admin/*" element={<Placeholder title="Admin dashboard (Sprint 2)" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
