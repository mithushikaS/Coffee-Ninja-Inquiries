const bcrypt = require('bcrypt');
const pool = require('../db');

const users = [
  ['alice@coffeeninja.test', 'Alice (Staff)',   'staff'],
  ['bob@coffeeninja.test',   'Bob (Staff)',     'staff'],
  ['maya@coffeeninja.test',  'Maya (Manager)',  'manager'],
];

(async () => {
  const hash = await bcrypt.hash('Password123!', 10);
  for (const [email, name, role] of users) {
    await pool.query(
      `INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO NOTHING`,
      [email, name, hash, role]
    );
  }
  console.log('Seeded users');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });