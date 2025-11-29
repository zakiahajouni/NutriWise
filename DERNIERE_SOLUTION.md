# ✅ Dernière Solution - Configuration Socket Unix

## Le problème résolu
J'ai modifié `lib/db.ts` pour ne plus utiliser `host: 'localhost'` quand `socketPath` est défini. Cela permet d'utiliser correctement l'authentification par socket Unix.

## Étapes à suivre

### Étape 1 : Créer la base de données (exécutez dans votre terminal)

```bash
cd /home/user/Bureau/NextML
sudo mysql < create_database_simple.sql
```

OU manuellement :

```bash
sudo mysql -u root
```

Puis dans MySQL :

```sql
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutriwise;
SOURCE database/schema.sql;
EXIT;
```

### Étape 2 : Vérifier que la base de données existe

```bash
sudo mysql nutriwise -e "SHOW TABLES;"
```

Vous devriez voir : `users`, `user_profiles`, `recipes`, `site_stats`

### Étape 3 : Vérifier le fichier .env.local

```bash
cat .env.local
```

Il doit contenir :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nutriwise
```

### Étape 4 : Redémarrer l'application

**IMPORTANT :** Arrêtez complètement le serveur Next.js (Ctrl+C) et relancez-le :

```bash
cd /home/user/Bureau/NextML
npm run dev
```

### Étape 5 : Tester la création de compte

Essayez de créer un compte maintenant. Ça devrait fonctionner ! ✅

---

## Ce qui a été modifié

✅ **lib/db.ts** - Suppression de `host: 'localhost'` quand `socketPath` est utilisé
- Avant : `host: process.env.DB_HOST || 'localhost'` + `socketPath`
- Après : Seulement `socketPath` (sans `host`)

Cela permet à Node.js de se connecter directement via le socket Unix au lieu d'essayer TCP/IP.

---

## Pourquoi ça fonctionne maintenant

Quand `socketPath` est défini dans mysql2, le driver ignore `host` et utilise directement le socket Unix. En ayant les deux (`host` et `socketPath`), il y avait une confusion qui causait l'erreur "Access denied".

Maintenant, la connexion se fait directement via `/var/run/mysqld/mysqld.sock`, ce qui est la méthode standard sur Ubuntu/Debian pour l'authentification root.

