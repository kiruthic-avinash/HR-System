let lastVerifyUrl = null;
jest.mock('../src/utils/mailer', () => ({
  sendVerificationEmail: jest.fn(async (to, url) => {
    lastVerifyUrl = url;
  }),
}));

const { app, request } = require('./helpers');

describe('auth flow', () => {
  const creds = {
    employeeId: 'EMP900',
    email: 'flow@test.local',
    password: 'Str0ngPass',
    role: 'employee',
  };

  it('rejects weak passwords with field-level details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...creds, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
  });

  it('registers and sends a verification link', async () => {
    const res = await request(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(lastVerifyUrl).toMatch(/verify-email\?token=[0-9a-f]{64}/);
  });

  it('blocks login before verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(403);
  });

  it('verifies email and then allows login with role redirect data', async () => {
    const token = new URL(lastVerifyUrl).searchParams.get('token');
    const verify = await request(app).get(`/api/auth/verify-email?token=${token}`);
    expect(verify.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: creds.password });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
    expect(login.body.user.role).toBe('employee');
  });

  it('rejects a reused verification token', async () => {
    const token = new URL(lastVerifyUrl).searchParams.get('token');
    const res = await request(app).get(`/api/auth/verify-email?token=${token}`);
    expect(res.status).toBe(400);
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(409);
  });

  it('rejects bad credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });
});
