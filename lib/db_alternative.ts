// Alternative: Configuration pour utiliser root avec socket Unix
// Si vous préférez utiliser root au lieu de nutriwise_user
// Renommez ce fichier en db.ts et supprimez l'ancien

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nutriwise',
  socketPath: '/var/run/mysqld/mysqld.sock', // Authentification par socket Unix
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

