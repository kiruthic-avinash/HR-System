import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { Card, Alert, apiError } from '../../components/ui';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'verifying', message: '' });

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState({ status: 'error', message: 'Missing verification token.' });
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then(() => setState({ status: 'ok', message: 'Your email is verified.' }))
      .catch((err) => setState({ status: 'error', message: apiError(err, 'Verification failed') }));
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="mb-3 text-xl font-semibold">Email verification</h1>
        {state.status === 'verifying' && <p className="text-sm text-slate-500">Verifying…</p>}
        {state.status === 'ok' && (
          <div className="space-y-3">
            <Alert kind="success">{state.message}</Alert>
            <Link to="/login" className="inline-block font-medium text-indigo-600 hover:underline">
              Continue to sign in →
            </Link>
          </div>
        )}
        {state.status === 'error' && <Alert>{state.message}</Alert>}
      </Card>
    </div>
  );
}
