# 🔧 Solution Finale - Erreur MySQL "Access denied"

## Problème
L'utilisateur `nutriwise_user` n'existe pas ou n'a pas les bons privilèges.

## Solution en 3 étapes

### Étape 1 : Créer l'utilisateur et la base de données

Exécutez cette commande dans votre terminal :

```bash
cd /home/user/Bureau/NextML
sudo mysql < fix_mysql_user.sql
```

Cette commande va :
- ✅ Supprimer l'ancien utilisateur s'il existe
- ✅ Créer la base de données `nutriwise`
- ✅ Créer l'utilisateur `nutriwise_user` avec le mot de passe `nutriwise_password_123`
- ✅ Accorder tous les privilèges
- ✅ Créer toutes les tables nécessaires

### Étape 2 : Vérifier que tout fonctionne

Testez la connexion :

```bash
mysql -u nutriwise_user -p nutriwise -e "SHOW TABLES;"
```

**Mot de passe à entrer :** `nutriwise_password_123`

Vous devriez voir :
```
+----------------------+
| Tables_in_nutriwise  |
+----------------------+
| recipes              |
| site_stats           |
| user_profiles        |
| users                |
+----------------------+
```

### Étape 3 : Vérifier le fichier .env.local

Assurez-vous que le fichier `.env.local` contient :

```bash
cat .env.local
```

Il doit contenir exactement :
```
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=nutriwise_password_123
DB_NAME=nutriwise
```

Si le fichier n'existe pas ou est incorrect, créez-le :

```bash
cat > .env.local << 'EOF'
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=nutriwise_password_123
DB_NAME=nutriwise
EOF
```

### Étape 4 : Redémarrer l'application

**Important :** Arrêtez complètement le serveur Next.js (Ctrl+C) et relancez-le :

```bash
npm run dev
```

### Étape 5 : Tester la création de compte

Essayez de créer un compte à nouveau. Ça devrait fonctionner maintenant ! ✅

---

## Si ça ne fonctionne toujours pas

### Option alternative : Utiliser root avec authentification socket

Si vous préférez utiliser root directement (sans mot de passe), modifiez `.env.local` :

```bash
cat > .env.local << 'EOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nutriwise
EOF
```

Et modifiez `lib/db.ts` pour utiliser l'authentification socket :

```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nutriwise',
  socketPath: '/var/run/mysqld/mysqld.sock', // Ajoutez cette ligne
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

Mais l'option avec l'utilisateur dédié est plus sécurisée et recommandée.

---

## Commandes de diagnostic

Si vous avez encore des problèmes, exécutez ces commandes pour diagnostiquer :

```bash
# Vérifier que MySQL tourne
sudo systemctl status mysql

# Vérifier que l'utilisateur existe
sudo mysql -e "SELECT user, host FROM mysql.user WHERE user='nutriwise_user';"

# Vérifier que la base de données existe
sudo mysql -e "SHOW DATABASES LIKE 'nutriwise';"

# Tester la connexion
mysql -u nutriwise_user -p nutriwise -e "SELECT 1;"
```

