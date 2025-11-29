# ✅ Créer les Tables - Solution Rapide

## Le problème
La connexion MySQL fonctionne maintenant, mais les tables n'existent pas encore dans la base de données `nutriwise`.

## Solution en 1 commande

Exécutez cette commande dans votre terminal :

```bash
cd /home/user/Bureau/NextML
mysql -u nutriwise -p nutriwise < create_tables_only.sql
```

**Mot de passe à entrer :** `nutriwise123`

OU avec sudo (si vous préférez) :

```bash
sudo mysql nutriwise < create_tables_only.sql
```

## Vérifier que les tables ont été créées

```bash
mysql -u nutriwise -p nutriwise -e "SHOW TABLES;"
```

**Mot de passe :** `nutriwise123`

Vous devriez voir les 4 tables :
- `users`
- `user_profiles`
- `recipes`
- `site_stats`

## Redémarrer l'application

**IMPORTANT :** Arrêtez complètement le serveur Next.js (Ctrl+C) et relancez-le :

```bash
cd /home/user/Bureau/NextML
npm run dev
```

## Tester la création de compte

Essayez de créer un compte maintenant. Ça devrait fonctionner ! ✅

---

## Alternative : Utiliser le schéma existant

Si vous préférez utiliser le fichier `database/schema.sql` :

```bash
cd /home/user/Bureau/NextML
mysql -u nutriwise -p nutriwise < database/schema.sql
```

**Mot de passe :** `nutriwise123`

