import mysql from 'mysql2/promise';

// Configuration MySQL
// Utilise un utilisateur avec mot de passe (plus fiable que root avec socket Unix)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'nutriwise',
  password: process.env.DB_PASSWORD || 'nutriwise123',
  database: process.env.DB_NAME || 'nutriwise',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

