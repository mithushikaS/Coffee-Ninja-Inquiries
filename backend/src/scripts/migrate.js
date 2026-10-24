const fs = require('fs');
const path = require('path');
const pool = require('../db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../../migrations/001_init.sql'), 'utf8');
  await pool.query('DROP TABLE IF EXISTS inquiries, users CASCADE');
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });