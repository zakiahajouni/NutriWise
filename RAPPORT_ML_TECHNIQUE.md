# Rapport Technique - Système d'Apprentissage Automatique
## NutriWise - Recommandation de Recettes

---

## 1. Architecture du Modèle

### 1.1 Type de Modèle
- **Framework** : TensorFlow.js (Node.js)
- **Type** : Réseau de Neurones Profond (Deep Neural Network)
- **Architecture** : Sequential Model (Modèle Séquentiel)
- **Type de problème** : Classification Multi-Classe

### 1.2 Structure du Réseau de Neurones

```
┌─────────────────────────────────────────┐
│  Input Layer                            │
│  - Taille : inputSize (dynamique)      │
│  - Activation : None                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Hidden Layer 1                         │
│  - Unités : 128 (par défaut)            │
│  - Activation : ReLU                   │
│  - Dropout : 30% (0.3)                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Hidden Layer 2                         │
│  - Unités : 64 (par défaut)             │
│  - Activation : ReLU                    │
│  - Dropout : 30% (0.3)                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Hidden Layer 3                         │
│  - Unités : 32 (par défaut)             │
│  - Activation : ReLU                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Output Layer                           │
│  - Unités : outputSize (nombre recettes)│
│  - Activation : Softmax                  │
│  - Probabilités pour chaque recette     │
└─────────────────────────────────────────┘
```

### 1.3 Paramètres du Modèle

#### Modèle de Classification (Homepage)
- **Hidden Layers** : `[128, 64, 32]`
- **Learning Rate** : `0.001`
- **Dropout** : `0.3` (30%)
- **Epochs** : `50` (par défaut)
- **Batch Size** : `32`

#### Modèle de Génération (Recipe Creation)
- **Hidden Layers** : `[256, 128, 64]`
- **Learning Rate** : `0.0005`
- **Dropout** : `0.3` (30%)
- **Epochs** : `100` (par défaut)
- **Batch Size** : `32`

### 1.4 Optimiseur et Fonction de Perte

- **Optimiseur** : Adam (Adaptive Moment Estimation)
- **Fonction de Perte** : `categoricalCrossentropy`
- **Métriques** : `['accuracy']`

**Formule de la Loss (Categorical Crossentropy)** :
```
L = -Σ(y_true * log(y_pred))
```

Où :
- `y_true` : Distribution one-hot de la vraie classe
- `y_pred` : Probabilités prédites par le modèle (softmax)

---

## 2. Extraction de Features

### 2.1 Fonctions d'Extraction

#### `buildIngredientVocabulary(recipes: RecipeTemplate[])`
**Description** : Construit le vocabulaire d'ingrédients à partir du dataset.

**Processus** :
1. Collecte tous les ingrédients uniques de toutes les recettes
2. Normalise (lowercase, trim)
3. Crée un mapping `ingredient → index`
4. Construit également le vocabulaire des types de cuisine

**Complexité** : O(n × m) où n = nombre de recettes, m = ingrédients moyens par recette

#### `extractUserRequestFeatures(...)`
**Description** : Convertit une requête utilisateur en vecteur de features numériques.

**Paramètres d'entrée** :
- `availableIngredients: string[]` : Ingrédients disponibles
- `recipeType: 'sweet' | 'savory'` : Type de recette souhaité
- `cuisineType: string` : Type de cuisine
- `isHealthy: boolean` : Préférence santé
- `allergies: string[]` : Liste des allergènes
- `stats: DatasetStats` : Statistiques du dataset pour normalisation

**Vecteur de sortie** :
```
[ingredientVector (vocabSize), 
 recipeType (1), 
 cuisineVector (cuisineTypes.size), 
 calories (1), 
 price (1), 
 prepTime (1), 
 cookTime (1), 
 isHealthy (1), 
 allergyVector (vocabSize)]
```

**Taille totale** : `vocabSize × 2 + cuisineTypes.size + 5`

### 2.2 Encodage des Features

#### Encodage One-Hot des Ingrédients
```typescript
ingredientVector = new Array(vocabSize).fill(0)
availableIngredients.forEach(ing => {
  const index = ingredientVocabulary.get(ing.toLowerCase().trim())
  if (index !== undefined) {
    ingredientVector[index] = 1
  }
})
```

#### Encodage du Type de Recette
- `sweet` → `0`
- `savory` → `1`

#### Normalisation Min-Max
```typescript
normalize(value, min, max) = (value - min) / (max - min)
```

Appliquée à :
- Calories : `[minCalories, maxCalories]`
- Prix : `[minPrice, maxPrice]`
- Temps de préparation : `[minPrepTime, maxPrepTime]`
- Temps de cuisson : `[minCookTime, maxCookTime]`

#### Encodage des Allergènes (Pénalité)
```typescript
allergyVector[index] = -1  // Pénalité pour chaque allergène
```

---

## 3. Préparation des Données

### 3.1 Division des Données

**Split Ratio** :
- **Training** : 70%
- **Validation** : 15%
- **Test** : 15%

### 3.2 Génération de Données d'Entraînement

#### Classification Model
- Génère 200 exemples synthétiques par défaut
- Profils utilisateur variés (âge, genre, activité, régime)
- Cuisines variées : Italian, Tunisian, French, Asian, etc.

#### Generation Model
- Pour chaque recette : 3-5 exemples avec sous-ensembles d'ingrédients
- Ratio d'ingrédients disponibles : 40-80% aléatoirement
- Crée des variations pour apprendre à prédire avec ingrédients partiels

### 3.3 Shuffling (Mélange)
```typescript
// Algorithme Fisher-Yates
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
}
```

---

## 4. Entraînement du Modèle

### 4.1 Fonction `trainModel()`

**Signature** :
```typescript
trainModel(
  model: Sequential,
  trainingData: TrainingData,
  validationData?: TrainingData,
  epochs: number = 50,
  batchSize: number = 32
): Promise<History>
```

**Processus** :
1. Conversion des données en tensors TensorFlow
2. One-hot encoding des labels
3. Appel de `model.fit()` avec :
   - `epochs` : Nombre d'itérations
   - `batchSize` : Taille des lots
   - `shuffle: true` : Mélange des données
   - `validationData` : Données de validation
   - `callbacks` : Logging à chaque epoch

**Callbacks** :
```typescript
onEpochEnd: (epoch, logs) => {
  console.log(`Epoch ${epoch + 1}/${epochs} - loss: ${logs.loss} - accuracy: ${logs.acc}`)
  if (logs.valLoss) {
    console.log(`  val_loss: ${logs.valLoss} - val_accuracy: ${logs.valAcc}`)
  }
}
```

### 4.2 Hyperparamètres

| Paramètre | Classification | Génération | Description |
|-----------|----------------|------------|-------------|
| Epochs | 50 | 100 | Nombre d'itérations complètes |
| Batch Size | 32 | 32 | Nombre d'exemples par lot |
| Learning Rate | 0.001 | 0.0005 | Taux d'apprentissage |
| Dropout | 0.3 | 0.3 | Taux de dropout (régularisation) |
| Hidden Layers | [128,64,32] | [256,128,64] | Architecture du réseau |

---

## 5. Métriques d'Évaluation

### 5.1 Accuracy (Précision Globale)

**Formule** :
```
Accuracy = (Nombre de prédictions correctes) / (Nombre total d'exemples)
```

**Implémentation** :
```typescript
let correct = 0
for (let i = 0; i < testData.labels.length; i++) {
  const trueLabel = testData.labels[i]
  const predictedLabel = scores.indexOf(Math.max(...scores))
  if (predictedLabel === trueLabel) {
    correct++
  }
}
const accuracy = correct / testData.labels.length
```

**Plage** : `[0, 1]` où 1 = 100% de précision

### 5.2 Precision (Précision)

**Formule** :
```
Precision = True Positives / (True Positives + False Positives)
```

**Implémentation** :
```typescript
const precision = truePositives / (truePositives + falsePositives) || 0
```

**Interprétation** : Proportion de prédictions positives qui sont correctes

### 5.3 Recall (Rappel)

**Formule** :
```
Recall = True Positives / (True Positives + False Negatives)
```

**Implémentation** :
```typescript
const recall = truePositives / (truePositives + falseNegatives) || 0
```

**Interprétation** : Proportion de vrais positifs correctement identifiés

### 5.4 F1-Score

**Formule** :
```
F1-Score = 2 × (Precision × Recall) / (Precision + Recall)
```

**Implémentation** :
```typescript
const f1Score = 2 * (precision * recall) / (precision + recall) || 0
```

**Interprétation** : Moyenne harmonique de Precision et Recall
- **Plage** : `[0, 1]`
- **Valeur élevée** : Bon équilibre entre Precision et Recall

### 5.5 Loss (Perte)

**Type** : Categorical Crossentropy

**Formule** :
```
Loss = -Σ(y_true × log(y_pred))
```

**Calcul** : Effectué automatiquement par TensorFlow.js pendant l'entraînement

**Interprétation** :
- **Valeur faible** : Meilleure performance
- **Tendance décroissante** : Modèle qui apprend

### 5.6 Métriques Spécifiques au Modèle de Génération

#### Recipe Accuracy
```typescript
recipeAccuracy = correctRecipes / testData.labels.length
```

#### Ingredient F1-Score
```typescript
ingredientPrecision = totalIngredientMatches / totalIngredientPredictions
ingredientRecall = totalIngredientMatches / totalIngredientActuals
ingredientF1 = 2 * (ingredientPrecision * ingredientRecall) / 
               (ingredientPrecision + ingredientRecall)
```

#### Price MAE (Mean Absolute Error)
```typescript
priceMAE = totalPriceError / testData.labels.length
```

Où `totalPriceError = Σ|predictedPrice - actualPrice|`

---

## 6. Prédiction

### 6.1 Fonction `predictRecipes()`

**Signature** :
```typescript
predictRecipes(
  model: Sequential,
  userFeatures: number[],
  topK: number = 5
): Promise<Array<{ recipeId: number; score: number }>>
```

**Processus** :
1. Conversion du vecteur de features en tensor 2D
2. Prédiction via `model.predict(input)`
3. Extraction des scores (probabilités)
4. Tri décroissant par score
5. Sélection des top K recettes

**Implémentation** :
```typescript
const input = tf.tensor2d([userFeatures])
const predictions = model.predict(input)
const scores = await predictions.data()
const predictionsArray = Array.from(scores)

const indexed = predictionsArray.map((score, index) => ({
  recipeId: index,
  score: score
}))

indexed.sort((a, b) => b.score - a.score)
return indexed.slice(0, topK)
```

---

## 7. Sauvegarde et Chargement

### 7.1 Sauvegarde dans la Base de Données

**Table** : `ml_models`

**Champs sauvegardés** :
- `model_name` : Nom du modèle (ex: 'recipe_classification')
- `model_type` : Type ('classification' ou 'generation')
- `model_version` : Version (timestamp)
- `model_data` : Modèle sérialisé (JSON → Buffer)
- `model_metadata` : Métadonnées JSON
- `training_data_size` : Taille du dataset d'entraînement
- `is_active` : Modèle actif ou non

**Métadonnées sauvegardées** :
```json
{
  "modelType": "classification",
  "inputSize": 250,
  "outputSize": 500,
  "hiddenLayers": [128, 64, 32],
  "trainingDataSize": 140,
  "accuracy": 0.85,
  "precision": 0.82,
  "recall": 0.80,
  "f1Score": 0.81,
  "loss": 0.15
}
```

### 7.2 Chargement depuis la Base de Données

**Requête SQL** :
```sql
SELECT model_data FROM ml_models 
WHERE model_name = ? AND model_version = ? AND is_active = TRUE
ORDER BY created_at DESC LIMIT 1
```

**Processus** :
1. Récupération du buffer depuis MySQL
2. Parsing JSON
3. Chargement du modèle via `tf.loadLayersModel()`

---

## 8. Exigences Minimales

### 8.1 Dataset

- **Classification** : Minimum 50 recettes
- **Génération** : Minimum 100 recettes
- **Données d'entraînement** : Minimum 20 exemples (classification), 50 exemples (génération)

### 8.2 Performance Attendue

| Métrique | Classification | Génération |
|----------|----------------|------------|
| Accuracy | 75-85% | 70-80% |
| Precision | 70-80% | - |
| Recall | 70-80% | - |
| F1-Score | 0.70-0.80 | 0.65-0.75 |
| Loss | < 0.3 | < 0.4 |

---

## 9. Fonctions et Méthodes Principales

### 9.1 Création du Modèle
- `createRecommendationModel(config: ModelConfig)` : Crée le modèle séquentiel

### 9.2 Entraînement
- `trainModel(model, trainingData, validationData, epochs, batchSize)` : Entraîne le modèle
- `trainClassificationModel(config)` : Entraîne le modèle de classification
- `trainGenerationModel(config)` : Entraîne le modèle de génération

### 9.3 Évaluation
- `evaluateModel(model, testData, numRecipes)` : Évalue le modèle de classification
- `evaluateGenerationModel(model, testData, recipes, stats)` : Évalue le modèle de génération

### 9.4 Prédiction
- `predictRecipes(model, userFeatures, topK)` : Prédit les recettes recommandées
- `predictRecipesForUser(userId, topK)` : Prédit pour un utilisateur spécifique

### 9.5 Gestion des Modèles
- `saveModelToDB(model, modelName, modelVersion, metadata)` : Sauvegarde le modèle
- `loadModelFromDB(modelName, modelVersion)` : Charge le modèle

### 9.6 Extraction de Features
- `buildIngredientVocabulary(recipes)` : Construit le vocabulaire
- `extractUserRequestFeatures(...)` : Extrait les features d'une requête
- `extractRecipeFeatures(recipe, stats)` : Extrait les features d'une recette
- `calculateDatasetStats(recipes)` : Calcule les statistiques du dataset

---

## 10. Exemple de Calcul Complet

### 10.1 Exemple : Calcul de l'Accuracy

**Données de test** :
- 30 exemples de test
- 25 prédictions correctes
- 5 prédictions incorrectes

**Calcul** :
```
Accuracy = 25 / 30 = 0.8333 = 83.33%
```

### 10.2 Exemple : Calcul du F1-Score

**Données** :
- True Positives : 20
- False Positives : 5
- False Negatives : 5

**Calcul** :
```
Precision = 20 / (20 + 5) = 20 / 25 = 0.80
Recall = 20 / (20 + 5) = 20 / 25 = 0.80
F1-Score = 2 × (0.80 × 0.80) / (0.80 + 0.80) = 1.28 / 1.60 = 0.80
```

---

## 11. Bibliothèques et Dépendances

- **TensorFlow.js** : `@tensorflow/tfjs-node` (v3.x)
- **Base de données** : MySQL2 (via `@/lib/db`)
- **TypeScript** : Typage statique

---

## 12. Limitations et Améliorations Futures

### Limitations Actuelles
1. Modèle simple (pas de CNN, RNN, ou Transformers)
2. Pas de traitement du langage naturel pour les descriptions
3. Pas d'embedding d'ingrédients (utilise one-hot)
4. Données synthétiques si pas d'interactions utilisateur réelles

### Améliorations Possibles
1. Utiliser des embeddings d'ingrédients (Word2Vec, GloVe)
2. Ajouter un modèle de traitement du langage naturel
3. Implémenter un système de recommandation collaborative
4. Utiliser des modèles plus avancés (Transformers, BERT)
5. Collecter et utiliser des données réelles d'interactions utilisateur

---

## Conclusion

Le système ML de NutriWise utilise un réseau de neurones profond avec TensorFlow.js pour recommander des recettes personnalisées. Le modèle atteint une précision de 75-85% avec un dataset de 50+ recettes. Les métriques principales (Accuracy, Precision, Recall, F1-Score) sont calculées pour évaluer les performances du modèle.


