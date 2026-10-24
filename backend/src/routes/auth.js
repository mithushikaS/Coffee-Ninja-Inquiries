const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const pool = require('../db');
const { HttpError } = require('../middleware/errors');
const { requireAuth, COOKIE_NAME } = require('../middleware/auth');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Enter a valid email and password.');
  }
  const { email, password } = parsed.data;

  const { rows } = await pool.query(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;