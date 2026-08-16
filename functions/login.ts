import jwt from 'jsonwebtoken'
import cookie from 'cookie'

const users = [{ username: 'sammc', password: 'mors7$QsfA!mXk8i' }];
const JWT_SECRET = 'd56gy7vtrcd865yujhbgy896';

const cookieHeader = (token: string, secure: boolean) =>
  `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 24 * 60 * 60}; ${secure ? 'Secure; ' : ''}SameSite=Strict`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secure = event.headers['x-forwarded-proto'] === 'https';

  // 1. Auth check: if a valid cookie already exists, confirm it (no body sent).
  try {
    if (event.headers.cookie) {
      const cookies = cookie.parse(event.headers.cookie)
      const token = cookies.token
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET)
        if (decoded) {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Already logged in' }),
            headers: {
              'Content-Type': 'application/json',
              'Set-Cookie': cookieHeader(token, secure)
            }
          };
        }
      }
    }
  } catch {
    // Invalid/expired token — fall through to credential login.
  }

  // 2. Credential login.
  try {
    if (!event.body) return { statusCode: 400, body: 'Bad Request' };
    const { username, password } = JSON.parse(event.body);

    const user = users.find(u => u.username === username);
    if (!user || user.password !== password) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '60d' });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Login successful' }),
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader(token, secure)
      }
    };
  } catch (error) {
    return { statusCode: 400, body: 'Bad Request' };
  }
};
