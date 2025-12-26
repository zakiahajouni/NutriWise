# Guide Rapide - Configuration ML

## ⚠️ Erreur : Table 'recipe_templates' doesn't exist

Si vous voyez cette erreur, suivez ces étapes :

---

## 🔧 Solution Rapide

### Étape 1 : Initialiser la base de données ML

```bash
npm run init:ml
```

Cette commande va :
- ✅ Créer toutes les tables nécessaires (`recipe_templates`, `ml_models`, etc.)
- ✅ Insérer 7 recettes de base dans le dataset
- ✅ Vérifier que tout est correctement configuré

### Étape 2 : Vérifier le dataset

```bash
# Vérifier le nombre de recettes
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) as total FROM recipe_templates;"
```

Vous devriez voir au moins 7 recettes.

### Étape 3 : Entraîner les modèles

```bash
npm run train:all
```

---

## 📊 Si vous avez moins de 50 recettes

Le modèle de classification nécessite **minimum 50 recettes**. 

### Option A : Ajouter plus de recettes manuellement

```sql
-- Se connecter à MySQL
mysql -u nutriwise -p nutriwise

-- Insérer une recette
INSERT INTO recipe_templates 
(name, description, ingredients, steps, prep_time, cook_time, servings, calories, estimated_price, cuisine_type, recipe_type, is_healthy, tags, difficulty) 
VALUES 
('Nom de la recette', 'Description', '["ingredient1", "ingredient2"]', '["étape1", "étape2"]', 15, 20, 4, 300, 10.00, 'Italian', 'savory', TRUE, '["tag1"]', 'easy');
```

### Option B : Utiliser le script de chargement

```bash
npx tsx scripts/load_rich_dataset.ts
```

### Option C : Utiliser l'API (si l'application tourne)

```bash
# Créer une recette via l'API
curl -X POST http://localhost:3000/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma Recette",
    "ingredients": ["ing1", "ing2"],
    ...
  }'
```

---

## 🔍 Vérification Complète

### 1. Vérifier que les tables existent

```sql
mysql -u nutriwise -p nutriwise -e "SHOW TABLES LIKE 'recipe_templates';"
mysql -u nutriwise -p nutriwise -e "SHOW TABLES LIKE 'ml_models';"
```

### 2. Vérifier le contenu

```sql
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"
mysql -u nutriwise -p nutriwise -e "SELECT name, cuisine_type, recipe_type FROM recipe_templates LIMIT 5;"
```

### 3. Vérifier la configuration de la base de données

Assurez-vous que votre fichier `.env.local` contient :

```env
DB_HOST=localhost
DB_USER=nutriwise
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nutriwise
```

---

## 🐛 Dépannage

### Erreur : "Access denied for user"

Vérifiez vos identifiants MySQL dans `.env.local` ou créez l'utilisateur :

```sql
CREATE USER 'nutriwise'@'localhost' IDENTIFIED BY 'nutriwise123';
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise'@'localhost';
FLUSH PRIVILEGES;
```

### Erreur : "Database doesn't exist"

Créez la base de données :

```sql
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erreur : "loadRecipeDataset is not defined"

✅ **CORRIGÉ** : J'ai ajouté l'import manquant dans `generationModel.ts`.

Si l'erreur persiste, vérifiez que vous avez bien installé les dépendances :

```bash
npm install
```

---

## 📝 Ordre d'Exécution Recommandé

1. **Initialiser la base de données ML**
   ```bash
   npm run init:ml
   ```

2. **Vérifier le dataset** (doit avoir ≥ 50 recettes pour classification)
   ```bash
   mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"
   ```

3. **Ajouter plus de recettes si nécessaire** (pour atteindre 50+)

4. **Entraîner les modèles**
   ```bash
   npm run train:all
   ```

5. **Voir les métriques**
   ```bash
   npm run metrics
   ```

---

## ✅ Checklist

- [ ] Base de données MySQL configurée
- [ ] Variables d'environnement définies (`.env.local`)
- [ ] Tables ML créées (`npm run init:ml`)
- [ ] Dataset avec ≥ 50 recettes
- [ ] Modèles entraînés (`npm run train:all`)
- [ ] Métriques récupérées (`npm run metrics`)

---

## 💡 Commandes Utiles

```bash
# Initialiser la base ML
npm run init:ml

# Entraîner tous les modèles
npm run train:all

# Entraîner uniquement la classification
npm run train:classification

# Entraîner uniquement la génération
npm run train:generation

# Voir les métriques
npm run metrics

# Vérifier le nombre de recettes
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"
```

---

Une fois que `npm run init:ml` est exécuté avec succès, vous pourrez entraîner vos modèles et obtenir les métriques réelles !

