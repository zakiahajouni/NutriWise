import mysql from 'mysql2/promise';

// Configuration MySQL pour Render.com
// Render fournit une URL de connexion interne pour les bases de données MySQL
function getDbConfig() {
  // Si Render fournit une URL de connexion (format: mysql://user:pass@host:port/db)
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  
  if (dbUrl) {
    try {
      // Parser l'URL de connexion Render
      const url = new URL(dbUrl);
      return {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Enlever le premier /
        port: parseInt(url.port) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: {
          rejectUnauthorized: false
        },
        connectTimeout: 10000,
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
    }
  }
  
  // Configuration par défaut avec variables d'environnement
  return {
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
    // SSL pour Render et autres hébergeurs cloud
    ssl: process.env.DB_SSL === 'true' || process.env.RENDER ? {
      rejectUnauthorized: false
    } : undefined,
    connectTimeout: 10000,
  };
}

const pool = mysql.createPool(getDbConfig());

// Test de connexion au démarrage
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données MySQL réussie');
    connection.release();
  } catch (error: any) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    console.error('💡 Variables d\'environnement disponibles:');
    console.error('   DB_HOST:', process.env.DB_HOST || 'non défini');
    console.error('   DB_USER:', process.env.DB_USER || 'non défini');
    console.error('   DB_NAME:', process.env.DB_NAME || 'non défini');
    console.error('   DATABASE_URL:', process.env.DATABASE_URL ? 'défini' : 'non défini');
    console.error('   RENDER:', process.env.RENDER || 'non défini');
    
    // Sur Render, ne pas bloquer le démarrage si la DB n'est pas disponible
    if (process.env.RENDER) {
      console.warn('⚠️  Application démarrée sans connexion DB (mode dégradé)');
    }
  }
}

// Tester la connexion au démarrage
testConnection();

export default pool;

