# ✅ Solution Définitive - Utilisateur MySQL avec mot de passe

## Le problème
L'authentification root avec socket Unix peut être problématique avec mysql2. La solution la plus fiable est de créer un utilisateur MySQL dédié avec un mot de passe.

## Solution en 2 étapes

### Étape 1 : Créer l'utilisateur et la base de données

Exécutez cette commande dans votre terminal :

```bash
cd /home/user/Bureau/NextML
sudo mysql < create_user_and_db.sql
```

Cette commande va :
- ✅ Créer la base de données `nutriwise`
- ✅ Créer l'utilisateur `nutriwise` avec le mot de passe `nutriwise123`
- ✅ Accorder tous les privilèges
- ✅ Créer toutes les tables nécessaires

### Étape 2 : Vérifier que ça fonctionne

Testez la connexion :

```bash
mysql -u nutriwise -p nutriwise -e "SHOW TABLES;"
```

**Mot de passe à entrer :** `nutriwise123`

Vous devriez voir les 4 tables : `users`, `user_profiles`, `recipes`, `site_stats`

### Étape 3 : Vérifier le fichier .env.local

Le fichier `.env.local` a été créé automatiquement avec les bonnes valeurs :

```bash
cat .env.local
```

Il doit contenir :
```
DB_HOST=localhost
DB_USER=nutriwise
DB_PASSWORD=nutriwise123
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

1. ✅ **lib/db.ts** - Configuration pour utiliser un utilisateur avec mot de passe au lieu de root avec socket Unix
2. ✅ **.env.local** - Configuré pour utiliser l'utilisateur `nutriwise` avec mot de passe
3. ✅ **create_user_and_db.sql** - Script SQL complet pour créer l'utilisateur et la base de données

---

## Pourquoi cette solution fonctionne

En créant un utilisateur MySQL dédié avec un mot de passe, on évite les problèmes d'authentification par socket Unix. L'utilisateur `nutriwise` peut se connecter via TCP/IP standard (localhost:3306) avec un mot de passe, ce qui est plus compatible avec mysql2.

---

## Commandes de diagnostic (si nécessaire)

```bash
# Vérifier que l'utilisateur existe
sudo mysql -e "SELECT user, host FROM mysql.user WHERE user='nutriwise';"

# Vérifier que la base de données existe
sudo mysql -e "SHOW DATABASES LIKE 'nutriwise';"

# Tester la connexion
mysql -u nutriwise -p nutriwise -e "SELECT 1;"
# Mot de passe : nutriwise123
```

