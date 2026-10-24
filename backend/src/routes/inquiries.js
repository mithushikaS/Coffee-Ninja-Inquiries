const router = require('express').Router();
const pool = require('../db');
const { HttpError } = require('../middleware/errors');
const { requireAuth } = require('../middleware/auth');
const { createSchema, statusSchema, fieldErrors } = require('../validation/inquiries');
const { STATUSES, canTransition, nextStatuses } = require('../inquiryRules');

router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SELECT = `
  SELECT i.id, i.customer_name AS "customerName", i.contact, i.subject, i.description,
         i.status, i.version, i.created_by AS "createdBy", u.name AS "createdByName",
         i.created_at AS "createdAt", i.updated_at AS "updatedAt"
  FROM inquiries i
  JOIN users u ON u.id = i.created_by`;

const present = (row) => ({ ...row, allowedNext: nextStatuses(row.status) });

// The access rule lives here: staff only see rows they created, managers see all.
function applyScope(user, where, params) {
  if (user.role !== 'manager') {
    params.push(user.id);
    where.push(`i.created_by = $${params.length}`);
  }
}

function parseId(raw) {
  if (!UUID_RE.test(raw)) {
    throw new HttpError(400, 'INVALID_ID', 'That inquiry ID is not valid.');
  }
  return raw;
}

async function findInquiry(id, user) {
  const where = ['i.id = $1'];
  const params = [id];
  applyScope(user, where, params);
  const { rows } = await pool.query(`${SELECT} WHERE ${where.join(' AND ')}`, params);
  if (!rows[0]) throw new HttpError(404, 'NOT_FOUND', 'Inquiry not found.');
  return rows[0];
}

function staleError(current) {
  return new HttpError(
    409,
    'STALE_VERSION',
    'This inquiry was updated elsewhere. Reload to see the latest version.',
    { current: present(current) }
  );
}

// ---- Create ----
router.post('/', async (req, res) => {
  const parsed = createSchema.safeParse({
    customerName: '', contact: '', subject: '', description: '', ...req.body,
  });
  if (!parsed.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', {
      fields: fieldErrors(parsed.error),
    });
  }
  const { customerName, contact, subject, description } = parsed.data;

  try {
    const { rows } = await pool.query(
      `INSERT INTO inquiries (customer_name, contact, subject, description, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [customerName, contact, subject, description, req.user.id]
    );
    const inquiry = await findInquiry(rows[0].id, req.user);
    return res.status(201).json({ inquiry: present(inquiry) });
  } catch (err) {
    if (err.code !== '23505') throw err; // 23505 = unique violation (duplicate index)
    const { rows } = await pool.query(
      `SELECT id FROM inquiries
       WHERE created_by = $1 AND lower(contact) = lower($2)
         AND lower(subject) = lower($3) AND status <> 'Resolved'`,
      [req.user.id, contact, subject]
    );
    throw new HttpError(
      409,
      'DUPLICATE_INQUIRY',
      'You already have an open inquiry with this contact and subject.',
      { existingId: rows[0]?.id }
    );
  }
});

// ---- List / search ----
router.get('/', async (req, res) => {
  const where = [];
  const params = [];
  applyScope(req.user, where, params);

  const { status } = req.query;
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, 'INVALID_FILTER', 'Status must be New, In Progress, or Resolved.');
    }
    params.push(status);
    where.push(`i.status = $${params.length}`);
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  if (q) {
    // Escape LIKE wildcards so a user typing % or _ searches for the literal character.
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    const n = params.length;
    where.push(`(i.customer_name ILIKE $${n} OR i.subject ILIKE $${n} OR i.contact ILIKE $${n})`);
  }

  const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY i.updated_at DESC LIMIT 200`;
  const { rows } = await pool.query(sql, params);
  res.json({ inquiries: rows.map(present) });
});

// ---- Read one ----
router.get('/:id', async (req, res) => {
  const inquiry = await findInquiry(parseId(req.params.id), req.user);
  res.json({ inquiry: present(inquiry) });
});

// ---- Change status ----
router.patch('/:id/status', async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Send a valid status and the version you last saw.', {
      fields: fieldErrors(parsed.error),
    });
  }
  const { status, version } = parsed.data;

  const current = await findInquiry(id, req.user);            // 404 if missing or not yours
  if (current.version !== version) throw staleError(current); // 409 stale

  if (!canTransition(current.status, status)) {
    throw new HttpError(
      409,
      'INVALID_TRANSITION',
      `Cannot move an inquiry from "${current.status}" to "${status}".`,
      { allowed: nextStatuses(current.status), current: present(current) }
    );
  }

  try {
    const result = await pool.query(
      `UPDATE inquiries
       SET status = $1, version = version + 1, updated_at = now()
       WHERE id = $2 AND version = $3`,
      [status, id, version]
    );
    if (result.rowCount === 0) throw staleError(await findInquiry(id, req.user)); // lost a race
  } catch (err) {
    if (err.code === '23505') {
      throw new HttpError(
        409,
        'DUPLICATE_OPEN',
        'Cannot reopen: another open inquiry with the same contact and subject already exists.'
      );
    }
    throw err;
  }

  const updated = await findInquiry(id, req.user);
  res.json({ inquiry: present(updated) });
});

module.exports = router;