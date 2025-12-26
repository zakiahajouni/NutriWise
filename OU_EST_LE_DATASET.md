# 📁 Où est le Fichier de Dataset ?

## ✅ Emplacement du Dataset

Le fichier de dataset se trouve ici :

```
📁 /home/user/Bureau/NextML/data/recipes_dataset.json
```

**Chemin relatif :** `data/recipes_dataset.json`

---

## 📊 Contenu du Dataset

✅ **Le fichier contient 500 recettes !**

C'est suffisant pour :
- ✅ Classification (besoin: 50+)
- ✅ Génération (besoin: 100+)

---

## ⚠️ Problème Actuel

Le dataset JSON contient **500 recettes**, mais seulement **7 recettes** sont dans la base de données MySQL.

**Il faut charger le fichier JSON dans MySQL !**

---

## 🔧 Solution : Charger le Dataset

### Méthode 1 : Script automatique (Recommandé)

```bash
npm run load:dataset
```

Ce script va :
1. Lire le fichier `data/recipes_dataset.json`
2. Insérer toutes les recettes dans la table `recipe_templates`
3. Éviter les doublons
4. Afficher le nombre de recettes insérées

### Méthode 2 : Vérifier avant de charger

```bash
# Vérifier combien de recettes sont actuellement dans la DB
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"

# Charger le dataset
npm run load:dataset

# Vérifier après chargement
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"
```

---

## 📝 Structure du Fichier JSON

Le fichier `data/recipes_dataset.json` a cette structure :

```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Spaghetti Carbonara",
      "cuisine": "italian",
      "recipeType": "savory",
      "calories": 502,
      "estimatedPrice": 25.7,
      "ingredients": ["pasta", "mozzarella", ...],
      "steps": ["Step 1", "Step 2", ...],
      "isHealthy": false,
      "difficulty": "hard",
      "prepTime": 18,
      "cookTime": 83,
      "servings": 2,
      "tags": ["healthy", "quick"],
      "description": "Delicious italian savory dish"
    },
    ...
  ]
}
```

---

## 🔍 Fichiers Liés au Dataset

| Fichier | Description |
|---------|-------------|
| `data/recipes_dataset.json` | ✅ **Fichier principal** - 500 recettes |
| `lib/ml/datasetGenerator.ts` | Code pour lire le fichier JSON |
| `lib/ml/datasetLoader.ts` | Code pour charger depuis MySQL |
| `scripts/load_rich_dataset.ts` | Script pour charger JSON → MySQL |

---

## 🚀 Étapes Complètes

1. **Vérifier que les tables existent**
   ```bash
   npm run init:ml
   ```

2. **Charger le dataset JSON dans MySQL**
   ```bash
   npm run load:dataset
   ```

3. **Vérifier le nombre de recettes**
   ```bash
   mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"
   ```
   Vous devriez voir **~500 recettes**

4. **Entraîner les modèles**
   ```bash
   npm run train:all
   ```

5. **Voir les métriques**
   ```bash
   npm run metrics
   ```

---

## 💡 Commandes Utiles

```bash
# Voir le nombre de recettes dans le JSON
cat data/recipes_dataset.json | grep -c '"name"'

# Voir le nombre de recettes dans MySQL
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) FROM recipe_templates;"

# Charger le dataset
npm run load:dataset

# Vérifier l'état complet
npm run check:models
```

---

## ✅ Résumé

- **Fichier dataset :** `data/recipes_dataset.json` ✅ (500 recettes)
- **Dans MySQL :** Seulement 7 recettes ❌
- **Solution :** Exécuter `npm run load:dataset` pour charger les 500 recettes

Une fois chargé, vous pourrez entraîner vos modèles et obtenir les métriques !

