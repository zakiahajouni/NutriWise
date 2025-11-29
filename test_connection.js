// Script de test pour vérifier la connexion MySQL
// Exécutez avec: node test_connection.js

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Test de connexion MySQL...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'nutriwise',
    password: process.env.DB_PASSWORD || 'nutriwise123',
    database: process.env.DB_NAME || 'nutriwise',
  };

  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : '(vide)'}`);
  console.log(`  Database: ${config.database}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie!\n');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test de requête réussi:', rows);
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📊 Tables trouvées:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    await connection.end();
    console.log('\n✅ Tous les tests sont passés!');
  } catch (error) {
    console.error('\n❌ Erreur de connexion:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code}`);
    console.error(`  SQL State: ${error.sqlState || 'N/A'}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Solution:');
      console.error('  1. Exécutez: sudo mysql < create_user_and_db.sql');
      console.error('  2. Vérifiez que le fichier .env.local contient les bonnes valeurs');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution:');
      console.error('  1. Vérifiez que MySQL est démarré: sudo systemctl status mysql');
      console.error('  2. Démarrez MySQL si nécessaire: sudo systemctl start mysql');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Solution:');
      console.error('  1. La base de données n\'existe pas');
      console.error('  2. Exécutez: sudo mysql < create_user_and_db.sql');
    }
  }
}

testConnection();

