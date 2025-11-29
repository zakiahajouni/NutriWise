# ✅ Solution Simple - Utiliser root avec socket Unix

## Le problème
L'utilisateur `nutriwise_user` n'a pas été créé correctement. Sur Ubuntu/Debian, MySQL utilise l'authentification par socket Unix pour root, ce qui est plus simple.

## Solution en 2 étapes

### Étape 1 : Créer la base de données

Exécutez cette commande :

```bash
cd /home/user/Bureau/NextML
sudo mysql < create_database_simple.sql
```

Cette commande va créer la base de données `nutriwise` et toutes les tables nécessaires.

### Étape 2 : Vérifier que ça fonctionne

```bash
sudo mysql nutriwise -e "SHOW TABLES;"
```

Vous devriez voir : `users`, `user_profiles`, `recipes`, `site_stats`

### Étape 3 : Redémarrer l'application

Le fichier `.env.local` est déjà configuré pour utiliser `root` sans mot de passe, et `lib/db.ts` a été modifié pour utiliser le socket Unix.

**Redémarrez votre serveur Next.js :**

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez
npm run dev
```

### Étape 4 : Tester

Essayez de créer un compte maintenant. Ça devrait fonctionner ! ✅

---

## Ce qui a été modifié

1. ✅ `lib/db.ts` - Ajout de `socketPath: '/var/run/mysqld/mysqld.sock'` pour utiliser l'authentification par socket Unix
2. ✅ `.env.local` - Configuré pour utiliser `root` sans mot de passe
3. ✅ `create_database_simple.sql` - Script SQL simple pour créer la base de données

---

## Pourquoi cette solution fonctionne

Sur Ubuntu/Debian, MySQL root utilise l'authentification par socket Unix au lieu d'un mot de passe. En spécifiant `socketPath` dans la configuration, Node.js peut se connecter directement via le socket Unix, ce qui évite les problèmes d'authentification.

