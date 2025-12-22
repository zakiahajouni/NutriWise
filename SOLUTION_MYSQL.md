# Solution pour le problème d'accès MySQL

## Problème
L'erreur `Access denied for user 'nutriwise'@'localhost'` indique que l'utilisateur MySQL n'existe pas ou a un mauvais mot de passe.

## Solution 1 : Recréer l'utilisateur avec socket Unix (Recommandé)

Exécutez cette commande dans votre terminal :

```bash
sudo bash /home/user/Bureau/NextML/fix_mysql_user_socket.sh
```

Cette commande va :
1. Supprimer l'ancien utilisateur `nutriwise` s'il existe
2. Créer un nouvel utilisateur avec le mot de passe `nutriwise123`
3. Créer la base de données `nutriwise` si elle n'existe pas
4. Accorder tous les privilèges
5. Tester la connexion

## Solution 2 : Utiliser root avec socket Unix

Si la solution 1 ne fonctionne pas, vous pouvez utiliser root avec authentification par socket :

### 1. Modifier `lib/db.ts` pour utiliser le socket :

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nutriwise',
  socketPath: '/var/run/mysqld/mysqld.sock',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
```

### 2. Créer la base de données et les tables :

```bash
sudo mysql --socket=/var/run/mysqld/mysqld.sock < setup_mysql_manual.sql
```

## Solution 3 : Utiliser root avec mot de passe

Si vous connaissez le mot de passe root MySQL :

### 1. Créer `.env.local` :

```bash
cat > /home/user/Bureau/NextML/.env.local << 'EOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_root
DB_NAME=nutriwise
EOF
```

### 2. Exécuter le script SQL :

```bash
mysql -u root -p < setup_mysql_manual.sql
```

## Vérification

Après avoir appliqué une solution, testez la connexion :

```bash
mysql -u nutriwise -pnutriwise123 -e "USE nutriwise; SHOW TABLES;"
```

Ou si vous utilisez root :

```bash
mysql -u root -p -e "USE nutriwise; SHOW TABLES;"
```

## Redémarrer l'application

Après avoir corrigé la configuration :

```bash
cd /home/user/Bureau/NextML
npm run dev
```

