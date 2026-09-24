import { Hono } from 'hono';
import { Env } from '../../types/env';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  // Simulated authenticated persona mapping
  let role = 'STUDENT';
  let userType = 'STUDENT';
  let fullName = 'Aondoaver Moses Iorliam';
  let division = 'NCE';

  if (username.toLowerCase().includes('admin')) {
    role = 'SUPER_ADMIN';
    userType = 'ADMIN';
    fullName = 'COEKA Portal Administrator';
  } else if (username.toLowerCase().includes('bursar')) {
    role = 'BURSAR';
    userType = 'STAFF';
    fullName = 'College Bursar';
  } else if (username.toLowerCase().includes('dean')) {
    role = 'DEAN';
    userType = 'STAFF';
    fullName = 'Dean, School of Sciences';
  } else if (username.toLowerCase().includes('hod')) {
    role = 'HOD';
    userType = 'STAFF';
    fullName = 'HOD Computer Science';
  } else if (username.toLowerCase().includes('lecturer')) {
    role = 'LECTURER';
    userType = 'STAFF';
    fullName = 'Dr. Terver Kange';
  } else if (username.toLowerCase().includes('parent')) {
    role = 'PARENT';
    userType = 'PARENT';
    fullName = 'Mr. Joshua T. Tsegha';
  }

  // Construct a standard JWT-formatted token
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: `usr-${Date.now()}`,
    username,
    role,
    userType,
    fullName,
    division,
    exp: Math.floor(Date.now() / 1000) + 86400,
  }));
  const token = `${header}.${payload}.signature_mock`;

  return c.json({
    message: 'Authentication successful',
    token,
    user: {
      username,
      fullName,
      role,
      userType,
      division,
    },
  });
});

authRoutes.get('/me', async (c) => {
  const user = c.get('user');
  return c.json({ user });
});
