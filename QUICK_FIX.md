# 🚀 Solution Rapide - Erreur MySQL

## Étapes à suivre (copier-coller)

### 1. Créer la base de données et l'utilisateur

```bash
cd /home/user/Bureau/NextML
sudo mysql < setup_database.sql
```

### 2. Vérifier que tout fonctionne

```bash
mysql -u nutriwise_user -p nutriwise -e "SHOW TABLES;"
# Mot de passe : nutriwise_password_123
```

Vous devriez voir : `users`, `user_profiles`, `recipes`, `site_stats`

### 3. Vérifier le fichier .env.local

```bash
cat .env.local
```

Il devrait contenir :
```
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=nutriwise_password_123
DB_NAME=nutriwise
```

### 4. Redémarrer l'application

```bash
# Arrêter le serveur (Ctrl+C dans le terminal où npm run dev tourne)
# Puis relancer
npm run dev
```

### 5. Tester la création de compte

Essayez de créer un compte à nouveau. Ça devrait fonctionner maintenant ! ✅

---

## Si ça ne fonctionne toujours pas

Vérifiez les logs du serveur Next.js pour voir l'erreur exacte.


