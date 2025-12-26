import mysql from 'mysql2/promise';

// Configuration MySQL
// Utilise un utilisateur avec mot de passe (plus fiable que root avec socket Unix)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'nutriwise',
  password: process.env.DB_PASSWORD || 'nutriwise123',
  database: process.env.DB_NAME || 'nutriwise',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Options pour Render.com et autres hébergeurs cloud
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined,
  // Timeout pour les connexions
  connectTimeout: 10000,
  // Retry logic
  acquireTimeout: 10000,
});

// Test de connexion au démarrage (en mode développement uniquement)
if (process.env.NODE_ENV === 'development') {
  pool.getConnection()
    .then(connection => {
      console.log('✅ Connexion à la base de données MySQL réussie');
      connection.release();
    })
    .catch(error => {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
      console.error('💡 Vérifiez que MySQL est démarré et que les variables d\'environnement sont correctes');
    });
}

export default pool;

