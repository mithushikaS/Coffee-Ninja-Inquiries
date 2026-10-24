const request = require('supertest');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const pool = require('../src/db');

const PASSWORD = 'Password123!';
const validInquiry = {
  customerName: 'Nimal Perera',
  contact: 'nimal@example.com',
  subject: 'Wrong order delivered',
  description: 'Received a latte instead of a cappuccino.',
};

async function loginAs(email) {
  const agent = request.agent(app); // an agent keeps the auth cookie between calls
  await agent.post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
  return agent;
}

beforeAll(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
  await pool.query('DROP TABLE IF EXISTS inquiries, users CASCADE');
  await pool.query(sql);
  const hash = await bcrypt.hash(PASSWORD, 4); // low cost keeps tests fast
  const users = [
    ['alice@coffeeninja.test', 'Alice', 'staff'],
    ['bob@coffeeninja.test', 'Bob', 'staff'],
    ['maya@coffeeninja.test', 'Maya', 'manager'],
  ];
  for (const [email, name, role] of users) {
    await pool.query(
      'INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,$4)',
      [email, name, hash, role]
    );
  }
});

beforeEach(async () => {
  await pool.query('DELETE FROM inquiries');
});

afterAll(async () => {
  await pool.end();
});

describe('authentication', () => {
  test('rejects requests with no valid session', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('access rule', () => {
  test('staff cannot read or list another staff member\'s inquiry; managers can', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const bob = await loginAs('bob@coffeeninja.test');
    const maya = await loginAs('maya@coffeeninja.test');

    const created = await alice.post('/api/inquiries').send(validInquiry).expect(201);
    const id = created.body.inquiry.id;

    const bobRead = await bob.get(`/api/inquiries/${id}`);
    expect(bobRead.status).toBe(404); // 404, not 403: don't reveal that the ID exists

    const bobList = await bob.get('/api/inquiries').expect(200);
    expect(bobList.body.inquiries).toHaveLength(0);

    const bobPatch = await bob
      .patch(`/api/inquiries/${id}/status`)
      .send({ status: 'In Progress', version: 1 });
    expect(bobPatch.status).toBe(404);

    await maya.get(`/api/inquiries/${id}`).expect(200);
  });
});

describe('validation and duplicates', () => {
  test('API rejects missing and invalid fields with per-field messages', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const res = await alice.post('/api/inquiries').send({ customerName: '', contact: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fields).toHaveProperty('customerName');
    expect(res.body.error.details.fields).toHaveProperty('contact');
    expect(res.body.error.details.fields).toHaveProperty('subject');
  });

  test('same contact + subject (case-insensitive) while open is a 409 with the existing id', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const first = await alice.post('/api/inquiries').send(validInquiry).expect(201);

    const dup = await alice.post('/api/inquiries').send({
      ...validInquiry,
      contact: 'NIMAL@example.com',
      subject: 'wrong order delivered',
    });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('DUPLICATE_INQUIRY');
    expect(dup.body.error.details.existingId).toBe(first.body.inquiry.id);
  });
});

describe('status lifecycle', () => {
  test('rejects an invalid transition with 409 and the allowed next statuses', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const { body } = await alice.post('/api/inquiries').send(validInquiry).expect(201);

    const res = await alice
      .patch(`/api/inquiries/${body.inquiry.id}/status`)
      .send({ status: 'Resolved', version: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
    expect(res.body.error.details.allowed).toEqual(['In Progress']);
  });

  test('a stale version is rejected with 409 and the latest record', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const { body } = await alice.post('/api/inquiries').send(validInquiry).expect(201);
    const id = body.inquiry.id;

    const first = await alice
      .patch(`/api/inquiries/${id}/status`)
      .send({ status: 'In Progress', version: 1 })
      .expect(200);
    expect(first.body.inquiry.version).toBe(2);

    // the "second tab" still thinks the version is 1
    const stale = await alice
      .patch(`/api/inquiries/${id}/status`)
      .send({ status: 'In Progress', version: 1 });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STALE_VERSION');
    expect(stale.body.error.details.current.version).toBe(2);
  });

  test('a resolved inquiry can be reopened', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const { body } = await alice.post('/api/inquiries').send(validInquiry).expect(201);
    const id = body.inquiry.id;
    await alice.patch(`/api/inquiries/${id}/status`).send({ status: 'In Progress', version: 1 }).expect(200);
    await alice.patch(`/api/inquiries/${id}/status`).send({ status: 'Resolved', version: 2 }).expect(200);
    const reopened = await alice
      .patch(`/api/inquiries/${id}/status`)
      .send({ status: 'In Progress', version: 3 })
      .expect(200);
    expect(reopened.body.inquiry.status).toBe('In Progress');
  });
});

describe('predictable failures', () => {
  test('malformed id is 400, well-formed unknown id is 404', async () => {
    const alice = await loginAs('alice@coffeeninja.test');
    const bad = await alice.get('/api/inquiries/not-a-uuid');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_ID');

    const missing = await alice.get('/api/inquiries/00000000-0000-4000-8000-000000000000');
    expect(missing.status).toBe(404);
  });
});