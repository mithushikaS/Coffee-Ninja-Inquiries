require('dotenv').config();
const app = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Check your .env file.');
  process.exit(1);
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));