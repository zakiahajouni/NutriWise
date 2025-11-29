# 📋 Étapes Détaillées - Résoudre l'erreur MySQL

## Étape 1 : Vérifier que MySQL est démarré

```bash
sudo systemctl status mysql
```

Si MySQL n'est pas démarré, démarrez-le :

```bash
sudo systemctl start mysql
sudo systemctl enable mysql
```

## Étape 2 : Créer l'utilisateur et la base de données

**IMPORTANT :** Exécutez cette commande dans votre terminal :

```bash
cd /home/user/Bureau/NextML
sudo mysql < create_user_and_db.sql
```

Cette commande va créer :
- La base de données `nutriwise`
- L'utilisateur `nutriwise` avec le mot de passe `nutriwise123`
- Toutes les tables nécessaires

## Étape 3 : Vérifier que l'utilisateur a été créé

```bash
sudo mysql -e "SELECT user, host FROM mysql.user WHERE user='nutriwise';"
```

Vous devriez voir une ligne avec `nutriwise` et `localhost`.

## Étape 4 : Vérifier que la base de données existe

```bash
sudo mysql -e "SHOW DATABASES LIKE 'nutriwise';"
```

Vous devriez voir la base de données `nutriwise`.

## Étape 5 : Tester la connexion manuellement

```bash
mysql -u nutriwise -p nutriwise -e "SHOW TABLES;"
```

**Mot de passe à entrer :** `nutriwise123`

Vous devriez voir les 4 tables : `users`, `user_profiles`, `recipes`, `site_stats`

## Étape 6 : Tester avec Node.js

```bash
cd /home/user/Bureau/NextML
node test_connection.js
```

Ce script va tester la connexion et vous dire exactement quel est le problème si ça ne fonctionne pas.

## Étape 7 : Vérifier le fichier .env.local

```bash
cat .env.local
```

Il doit contenir exactement :
```
DB_HOST=localhost
DB_USER=nutriwise
DB_PASSWORD=nutriwise123
DB_NAME=nutriwise
```

## Étape 8 : Redémarrer l'application

**IMPORTANT :** Arrêtez complètement le serveur Next.js (Ctrl+C) et relancez-le :

```bash
cd /home/user/Bureau/NextML
npm run dev
```

## Étape 9 : Tester la création de compte

Essayez de créer un compte maintenant. Ça devrait fonctionner ! ✅

---

## Si ça ne fonctionne toujours pas

### Option A : Recréer l'utilisateur manuellement

Connectez-vous à MySQL :

```bash
sudo mysql -u root
```

Puis exécutez ces commandes SQL :

```sql
-- Supprimer l'utilisateur s'il existe
DROP USER IF EXISTS 'nutriwise'@'localhost';

-- Créer l'utilisateur avec mot de passe
CREATE USER 'nutriwise'@'localhost' IDENTIFIED BY 'nutriwise123';

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier
SELECT user, host FROM mysql.user WHERE user='nutriwise';
SHOW DATABASES LIKE 'nutriwise';

-- Quitter
EXIT;
```

### Option B : Utiliser root avec authentification native

Si vous préférez utiliser root avec un mot de passe :

```bash
sudo mysql -u root
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root_password_123';
FLUSH PRIVILEGES;
EXIT;
```

Puis modifiez `.env.local` :

```bash
cat > .env.local << 'EOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root_password_123
DB_NAME=nutriwise
EOF
```

Et modifiez `lib/db.ts` pour retirer `socketPath` et utiliser TCP/IP normal.

