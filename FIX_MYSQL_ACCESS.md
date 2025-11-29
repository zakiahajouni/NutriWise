# Solution : Erreur "Access denied for user 'root'@'localhost'"

## Problème
MySQL sur Ubuntu/Debian utilise l'authentification par socket Unix pour root, ce qui empêche la connexion avec un mot de passe.

## Solution : Créer un utilisateur dédié

### Option 1 : Créer un utilisateur avec mot de passe (Recommandé)

Connectez-vous à MySQL avec sudo :

```bash
sudo mysql -u root
```

Puis exécutez ces commandes SQL :

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer un utilisateur dédié avec mot de passe
CREATE USER IF NOT EXISTS 'nutriwise_user'@'localhost' IDENTIFIED BY 'nutriwise_password_123';

-- Accorder tous les privilèges
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise_user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier
SHOW DATABASES;
EXIT;
```

### Option 2 : Modifier root pour utiliser un mot de passe

Si vous préférez utiliser root :

```bash
sudo mysql -u root
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'votre_mot_de_passe';
FLUSH PRIVILEGES;
EXIT;
```

## Configurer .env.local

Créez ou modifiez le fichier `.env.local` à la racine du projet :

**Si vous utilisez l'utilisateur dédié (Option 1 - Recommandé) :**

```env
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=nutriwise_password_123
DB_NAME=nutriwise
```

**Si vous utilisez root (Option 2) :**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nutriwise
```

## Importer le schéma

Après avoir créé la base de données, importez le schéma :

```bash
cd /home/user/Bureau/NextML

# Avec l'utilisateur dédié
mysql -u nutriwise_user -p nutriwise < database/schema.sql
# Entrez le mot de passe : nutriwise_password_123

# OU avec root
sudo mysql -u root nutriwise < database/schema.sql
```

## Vérifier la connexion

Testez la connexion :

```bash
# Avec l'utilisateur dédié
mysql -u nutriwise_user -p nutriwise -e "SHOW TABLES;"

# OU avec root
sudo mysql -u root nutriwise -e "SHOW TABLES;"
```

Vous devriez voir : `users`, `user_profiles`, `recipes`, `site_stats`

## Redémarrer l'application

Après avoir configuré MySQL et créé `.env.local`, redémarrez votre serveur Next.js :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

## Commandes rapides (copier-coller)

```bash
# 1. Se connecter à MySQL
sudo mysql -u root

# 2. Dans MySQL, exécuter :
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'nutriwise_user'@'localhost' IDENTIFIED BY 'nutriwise_password_123';
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Importer le schéma
cd /home/user/Bureau/NextML
mysql -u nutriwise_user -p nutriwise < database/schema.sql
# Mot de passe : nutriwise_password_123

# 4. Créer .env.local
cat > .env.local << 'EOF'
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=nutriwise_password_123
DB_NAME=nutriwise
EOF

# 5. Redémarrer l'application
npm run dev
```


