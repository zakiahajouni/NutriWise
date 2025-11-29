# 🚀 Commandes Exactes à Exécuter

## Méthode 1 : Exécuter le fichier SQL (Recommandé)

J'ai créé le fichier `setup_mysql_manual.sql` avec toutes vos commandes. Exécutez simplement :

```bash
cd /home/user/Bureau/NextML
sudo mysql < setup_mysql_manual.sql
```

Cette commande va :
- ✅ Créer l'utilisateur `nutriwise` avec le mot de passe `nutriwise123`
- ✅ Créer la base de données `nutriwise`
- ✅ Accorder tous les privilèges
- ✅ Créer toutes les tables nécessaires

## Méthode 2 : Exécuter manuellement dans MySQL

Si vous préférez exécuter les commandes une par une :

```bash
sudo mysql -u root
```

Puis copiez-collez ces commandes dans le terminal MySQL :

```sql
DROP USER IF EXISTS 'nutriwise'@'localhost';
CREATE USER 'nutriwise'@'localhost' IDENTIFIED BY 'nutriwise123';
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Note :** N'oubliez pas de taper `EXIT;` à la fin pour quitter MySQL.

## Après avoir créé l'utilisateur et la base de données

### Étape 1 : Importer le schéma (créer les tables)

```bash
cd /home/user/Bureau/NextML
sudo mysql nutriwise < database/schema.sql
```

OU si vous avez utilisé `setup_mysql_manual.sql`, les tables sont déjà créées.

### Étape 2 : Vérifier que tout fonctionne

```bash
mysql -u nutriwise -p nutriwise -e "SHOW TABLES;"
```

**Mot de passe :** `nutriwise123`

Vous devriez voir : `users`, `user_profiles`, `recipes`, `site_stats`

### Étape 3 : Redémarrer l'application

```bash
cd /home/user/Bureau/NextML
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### Étape 4 : Tester la création de compte

Essayez de créer un compte maintenant. Ça devrait fonctionner ! ✅

---

## Résumé des fichiers

- **setup_mysql_manual.sql** - Script complet avec vos commandes + création des tables
- **create_user_and_db.sql** - Script alternatif (même chose)
- **database/schema.sql** - Schéma des tables uniquement (si vous avez déjà créé la base de données)

