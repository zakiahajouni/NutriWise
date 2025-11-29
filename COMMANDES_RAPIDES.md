# 🚀 Commandes Rapides - Copier-Coller

## Solution Recommandée (Utilisateur dédié)

### 1. Créer l'utilisateur et la base de données

```bash
cd /home/user/Bureau/NextML && sudo mysql < fix_mysql_user.sql
```

### 2. Vérifier la connexion

```bash
mysql -u nutriwise_user -p nutriwise -e "SHOW TABLES;"
```
**Mot de passe :** `nutriwise_password_123`

### 3. Vérifier/Créer .env.local

```bash
cat > /home/user/Bureau/NextML/.env.local << 'EOF'
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=nutriwise_password_123
DB_NAME=nutriwise
EOF
```

### 4. Redémarrer l'application

```bash
cd /home/user/Bureau/NextML
npm run dev
```

---

## Solution Alternative (Si la première ne fonctionne pas)

### Utiliser root avec socket Unix

### 1. Créer seulement la base de données

```bash
cd /home/user/Bureau/NextML
sudo mysql -e "CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql nutriwise < database/schema.sql
```

### 2. Modifier .env.local pour utiliser root

```bash
cat > /home/user/Bureau/NextML/.env.local << 'EOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nutriwise
EOF
```

### 3. Modifier lib/db.ts pour utiliser socket

Remplacez le contenu de `lib/db.ts` par celui de `lib/db_alternative.ts` (ou ajoutez `socketPath: '/var/run/mysqld/mysqld.sock'` dans la config).

### 4. Redémarrer l'application

```bash
npm run dev
```

---

## Diagnostic

Si vous avez des problèmes, exécutez :

```bash
# Vérifier MySQL
sudo systemctl status mysql

# Vérifier l'utilisateur
sudo mysql -e "SELECT user, host FROM mysql.user WHERE user='nutriwise_user';"

# Vérifier la base de données
sudo mysql -e "SHOW DATABASES LIKE 'nutriwise';"

# Tester la connexion
mysql -u nutriwise_user -p nutriwise -e "SELECT 1;"
```

