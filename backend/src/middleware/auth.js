const jwt = require('jsonwebtoken');
const pool = require('../db');
const { HttpError } = require('./errors');

const COOKIE_NAME = 'token';

async function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Your session has expired. Please sign in again.');
  }

  const { rows } = await pool.query(
    'SELECT id, email, name, role FROM users WHERE id = $1',
    [payload.sub]
  );
  if (!rows[0]) throw new HttpError(401, 'UNAUTHENTICATED', 'Please sign in.');

  req.user = rows[0];
  next();
}

module.exports = { requireAuth, COOKIE_NAME };