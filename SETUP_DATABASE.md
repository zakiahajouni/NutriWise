# Guide d'Installation de MySQL pour NutriWise

## Problème
MySQL n'est pas installé sur votre système, ce qui cause l'erreur 500 lors de la création de compte.

## Solution : Installer MySQL

### Option 1 : Installer MySQL Server (Recommandé)

```bash
# Mettre à jour les paquets
sudo apt update

# Installer MySQL Server
sudo apt install mysql-server

# Démarrer MySQL
sudo systemctl start mysql

# Activer MySQL au démarrage
sudo systemctl enable mysql

# Vérifier le statut
sudo systemctl status mysql
```

### Option 2 : Installer MariaDB (Alternative à MySQL)

```bash
# Installer MariaDB
sudo apt install mariadb-server

# Démarrer MariaDB
sudo systemctl start mariadb

# Activer MariaDB au démarrage
sudo systemctl enable mariadb

# Vérifier le statut
sudo systemctl status mariadb
```

## Configuration de la Base de Données

### 1. Sécuriser l'installation MySQL (Recommandé)

```bash
sudo mysql_secure_installation
```

Suivez les instructions pour :
- Définir un mot de passe root
- Supprimer les utilisateurs anonymes
- Désactiver la connexion root à distance
- Supprimer la base de données de test

### 2. Créer la base de données et l'utilisateur

Connectez-vous à MySQL :

```bash
sudo mysql -u root -p
```

Puis exécutez ces commandes SQL :

```sql
-- Créer la base de données
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer un utilisateur (remplacez 'votre_mot_de_passe' par un mot de passe sécurisé)
CREATE USER IF NOT EXISTS 'nutriwise_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';

-- Accorder les permissions
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise_user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier
SHOW DATABASES;
EXIT;
```

### 3. Importer le schéma de la base de données

```bash
# Depuis le répertoire du projet
cd /home/user/Bureau/NextML

# Importer le schéma
mysql -u nutriwise_user -p nutriwise < database/schema.sql
```

Ou connectez-vous et exécutez le script :

```bash
mysql -u nutriwise_user -p nutriwise
```

Puis dans MySQL :

```sql
SOURCE database/schema.sql;
EXIT;
```

### 4. Créer le fichier .env.local

Créez le fichier `.env.local` à la racine du projet :

```bash
cd /home/user/Bureau/NextML
cat > .env.local << 'EOF'
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nutriwise
EOF
```

**Important** : Remplacez `votre_mot_de_passe` par le mot de passe que vous avez défini à l'étape 2.

### 5. Vérifier la connexion

Testez la connexion :

```bash
mysql -u nutriwise_user -p nutriwise -e "SHOW TABLES;"
```

Vous devriez voir les tables : `users`, `user_profiles`, `recipes`, `site_stats`

## Redémarrer l'application

Après avoir configuré MySQL, redémarrez votre serveur Next.js :

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis relancer
npm run dev
```

## Vérification

Une fois MySQL installé et configuré, essayez de créer un compte à nouveau. L'erreur 500 devrait être résolue.

## Dépannage

### Si MySQL ne démarre pas :

```bash
# Vérifier les logs
sudo journalctl -u mysql -n 50

# Vérifier le port
sudo netstat -tuln | grep 3306
```

### Si vous avez des problèmes de connexion :

1. Vérifiez que MySQL est en cours d'exécution : `sudo systemctl status mysql`
2. Vérifiez les identifiants dans `.env.local`
3. Testez la connexion manuellement : `mysql -u nutriwise_user -p nutriwise`


