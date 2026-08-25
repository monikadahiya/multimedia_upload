require('./setup');
const request = require('supertest');
const app = require('../app');

describe('Auth API', () => {
  const credentials = { name: 'Jane Doe', email: 'jane@example.com', password: 'SuperSecret123' };

  test('registers a new user and sets auth cookies', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.headers['set-cookie'].some((c) => c.startsWith('accessToken'))).toBe(true);
  });

  test('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, password: 'weak' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.status).toBe(409);
  });

  test('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  test('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(credentials);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'WrongPassword1' });
    expect(res.status).toBe(401);
  });

  test('blocks access to /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('allows access to /me with a valid access token cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(credentials);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });
});
