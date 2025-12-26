# Comment Obtenir les Métriques Réelles de vos Modèles

Ce guide explique comment obtenir les métriques réelles (Accuracy, Precision, Recall, F1-Score, Loss) de vos modèles ML.

---

## 📊 Méthode 1 : Via les Scripts (Recommandé)

### Option A : Entraîner et voir les métriques immédiatement

```bash
# Entraîner les deux modèles et afficher les métriques
npx ts-node scripts/train_and_show_metrics.ts

# Entraîner uniquement le modèle de classification
npx ts-node scripts/train_and_show_metrics.ts classification

# Entraîner uniquement le modèle de génération
npx ts-node scripts/train_and_show_metrics.ts generation
```

**Ce script va :**
1. Entraîner le(s) modèle(s)
2. Calculer les métriques automatiquement
3. Afficher les résultats dans la console
4. Sauvegarder les métriques dans la base de données

**Exemple de sortie :**
```
📈 Métriques Finales:
   ┌─────────────────────────────────────────────────────────┐
   │ Métrique          │ Valeur                              │
   ├─────────────────────────────────────────────────────────┤
   │ Accuracy          │ 82.50%                              │
   │ Precision         │ 78.30%                              │
   │ Recall            │ 80.10%                              │
   │ F1-Score          │ 0.7919                              │
   └─────────────────────────────────────────────────────────┘
```

### Option B : Récupérer les métriques depuis la base de données

Si vous avez déjà entraîné des modèles, vous pouvez récupérer leurs métriques :

```bash
npx ts-node scripts/get_model_metrics.ts
```

**Ce script affiche :**
- Tous les modèles entraînés
- Leurs métriques complètes
- Leur statut (actif/inactif)
- Leur architecture

---

## 🌐 Méthode 2 : Via l'API REST

### Entraîner le modèle de classification

```bash
# Obtenir un token d'authentification d'abord (via login)
TOKEN="votre_token_jwt"

# Entraîner le modèle
curl -X POST http://localhost:3000/api/ml/train-classification \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 50,
    "batchSize": 32,
    "learningRate": 0.001,
    "hiddenLayers": [128, 64, 32],
    "dropout": 0.3
  }'
```

**Réponse JSON :**
```json
{
  "success": true,
  "message": "Classification model trained successfully. Accuracy: 0.8250, F1: 0.7919",
  "modelId": 1,
  "accuracy": 0.8250,
  "precision": 0.7830,
  "recall": 0.8010,
  "f1Score": 0.7919
}
```

### Entraîner le modèle de génération

```bash
curl -X POST http://localhost:3000/api/ml/train-generation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 100,
    "batchSize": 32,
    "learningRate": 0.0005,
    "hiddenLayers": [256, 128, 64],
    "dropout": 0.3
  }'
```

**Réponse JSON :**
```json
{
  "success": true,
  "message": "Generation model trained successfully. Recipe Accuracy: 0.7500, Ingredient F1: 0.6800",
  "modelId": 2,
  "recipeAccuracy": 0.7500,
  "ingredientF1": 0.6800,
  "priceMAE": 2.50
}
```

---

## 💾 Méthode 3 : Depuis la Base de Données MySQL

Les métriques sont sauvegardées dans la table `ml_models` :

```sql
-- Voir tous les modèles avec leurs métriques
SELECT 
  id,
  model_name,
  model_type,
  model_version,
  training_data_size,
  training_date,
  is_active,
  JSON_PRETTY(model_metadata) as metadata,
  JSON_PRETTY(performance_metrics) as performance
FROM ml_models
ORDER BY training_date DESC;
```

**Exemple de résultat :**
```json
{
  "modelType": "classification",
  "inputSize": 250,
  "outputSize": 50,
  "hiddenLayers": [128, 64, 32],
  "trainingDataSize": 140,
  "accuracy": 0.8250,
  "precision": 0.7830,
  "recall": 0.8010,
  "f1Score": 0.7919,
  "loss": 0.2450
}
```

---

## 📈 Métriques Disponibles

### Pour le Modèle de Classification

| Métrique | Description | Plage | Code |
|----------|-------------|-------|------|
| **Accuracy** | Précision globale | 0-1 (0-100%) | `classificationModel.ts` ligne 337 |
| **Precision** | Précision des prédictions positives | 0-1 (0-100%) | `classificationModel.ts` ligne 338 |
| **Recall** | Rappel (couverture) | 0-1 (0-100%) | `classificationModel.ts` ligne 339 |
| **F1-Score** | Moyenne harmonique Precision/Recall | 0-1 | `classificationModel.ts` ligne 340 |
| **Loss** | Perte (Categorical Crossentropy) | > 0 (plus bas = mieux) | `classificationModel.ts` ligne 102 |

### Pour le Modèle de Génération

| Métrique | Description | Plage | Code |
|----------|-------------|-------|------|
| **Recipe Accuracy** | Précision de sélection de recette | 0-1 (0-100%) | `generationModel.ts` ligne 297 |
| **Ingredient F1** | F1-Score pour prédiction d'ingrédients | 0-1 | `generationModel.ts` ligne 300 |
| **Price MAE** | Erreur absolue moyenne du prix | $ (plus bas = mieux) | `generationModel.ts` ligne 301 |
| **Loss** | Perte d'entraînement | > 0 (plus bas = mieux) | `generationModel.ts` ligne 104 |

---

## 🔍 Où sont Calculées les Métriques ?

### Classification Model

**Fichier :** `lib/ml/classificationModel.ts`

- **Ligne 99** : Évaluation sur le test set
- **Ligne 102-105** : Récupération de la loss et accuracy finale
- **Ligne 107-112** : Affichage des métriques dans la console
- **Ligne 128-132** : Sauvegarde des métriques dans la DB
- **Ligne 294-343** : Fonction `evaluateModel()` qui calcule toutes les métriques

### Generation Model

**Fichier :** `lib/ml/generationModel.ts`

- **Ligne 101** : Évaluation sur le test set
- **Ligne 104-107** : Récupération de la loss et accuracy finale
- **Ligne 109-113** : Affichage des métriques dans la console
- **Ligne 129-133** : Sauvegarde des métriques dans la DB
- **Ligne 236-304** : Fonction `evaluateGenerationModel()` qui calcule toutes les métriques

---

## ⚙️ Prérequis

Avant d'entraîner les modèles, assurez-vous que :

1. **La base de données MySQL est configurée** :
   ```bash
   mysql -u nutriwise -p nutriwise < database/ml_schema.sql
   ```

2. **Le dataset contient assez de recettes** :
   - Minimum 50 recettes pour classification
   - Minimum 100 recettes pour génération

3. **Les dépendances sont installées** :
   ```bash
   npm install
   ```

4. **Les variables d'environnement sont configurées** :
   ```bash
   # .env.local
   DB_HOST=localhost
   DB_USER=nutriwise
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=nutriwise
   ```

---

## 📝 Exemple Complet

### 1. Vérifier le dataset

```bash
mysql -u nutriwise -p nutriwise -e "SELECT COUNT(*) as total_recipes FROM recipe_templates;"
```

### 2. Entraîner les modèles

```bash
npx ts-node scripts/train_and_show_metrics.ts
```

### 3. Voir les métriques sauvegardées

```bash
npx ts-node scripts/get_model_metrics.ts
```

### 4. Utiliser les métriques dans votre rapport

Les métriques affichées peuvent être directement utilisées dans votre rapport LaTeX :

```latex
\begin{table}[h]
\centering
\begin{tabular}{|l|c|c|}
\hline
\textbf{Métrique} & \textbf{Classification} & \textbf{Génération} \\
\hline
Accuracy & 82.50\% & 75.00\% \\
Precision & 78.30\% & - \\
Recall & 80.10\% & - \\
F1-Score & 0.7919 & 0.6800 \\
Loss & 0.2450 & 0.3200 \\
\hline
\end{tabular}
\caption{Métriques de performance des modèles}
\end{table}
```

---

## 🐛 Dépannage

### "Dataset too small"
- Ajoutez plus de recettes dans la table `recipe_templates`
- Minimum requis : 50 pour classification, 100 pour génération

### "No model found"
- Entraînez d'abord un modèle avec `train_and_show_metrics.ts`
- Vérifiez que la base de données est accessible

### Métriques très faibles (< 50%)
- Vérifiez la qualité du dataset
- Augmentez le nombre d'epochs
- Ajustez les hyperparamètres (learning rate, hidden layers)

---

## 📚 Références

- Code source : `lib/ml/classificationModel.ts` et `lib/ml/generationModel.ts`
- Documentation technique : `RAPPORT_ML_TECHNIQUE.md`
- Résumé des métriques : `RESUME_ML_POUR_RAPPORT.md`

