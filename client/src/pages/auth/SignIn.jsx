import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, homePathFor } from '../../context/AuthContext';
import { Field, Input, Button, Alert, Card, apiError } from '../../components/ui';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const notice = location.state?.notice;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(homePathFor(user), { replace: true });
    } catch (err) {
      setError(apiError(err, 'Sign in failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-xl font-semibold">Sign in to HR System</h1>
        <p className="mb-4 text-sm text-slate-500">Use your work email and password.</p>
        <div className="space-y-3">
          <Alert kind="info">{notice}</Alert>
          <Alert>{error}</Alert>
          <form onSubmit={onSubmit} className="space-y-3">
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
