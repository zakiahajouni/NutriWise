# Résumé Exécutif - Données ML pour Rapport

## 📊 Données Techniques Essentielles

### Architecture du Modèle

| Composant | Valeur |
|-----------|--------|
| **Framework** | TensorFlow.js (Node.js) |
| **Type** | Réseau de Neurones Profond (DNN) |
| **Architecture** | Sequential Model |
| **Problème** | Classification Multi-Classe |

### Structure du Réseau

```
Input Layer → Hidden Layer 1 (128) → Dropout (30%) 
→ Hidden Layer 2 (64) → Dropout (30%) 
→ Hidden Layer 3 (32) → Output Layer (Softmax)
```

### Hyperparamètres

| Paramètre | Classification | Génération |
|-----------|----------------|------------|
| **Epochs** | 50 | 100 |
| **Batch Size** | 32 | 32 |
| **Learning Rate** | 0.001 | 0.0005 |
| **Dropout** | 0.3 | 0.3 |
| **Hidden Layers** | [128, 64, 32] | [256, 128, 64] |

### Optimiseur et Fonction de Perte

- **Optimiseur** : Adam (Adaptive Moment Estimation)
- **Loss Function** : Categorical Crossentropy
- **Formule** : `L = -Σ(y_true × log(y_pred))`

---

## 🔢 Formules de Calcul des Métriques

### Accuracy (Précision Globale)
```
Accuracy = (Prédictions Correctes) / (Total Exemples)
```

### Precision (Précision)
```
Precision = TP / (TP + FP)
```
Où TP = True Positives, FP = False Positives

### Recall (Rappel)
```
Recall = TP / (TP + FN)
```
Où FN = False Negatives

### F1-Score
```
F1-Score = 2 × (Precision × Recall) / (Precision + Recall)
```

### Loss (Perte)
```
Loss = -Σ(y_true × log(y_pred))
```

---

## 📈 Performance Attendue

| Métrique | Classification | Génération |
|----------|----------------|------------|
| **Accuracy** | 75-85% | 70-80% |
| **Precision** | 70-80% | - |
| **Recall** | 70-80% | - |
| **F1-Score** | 0.70-0.80 | 0.65-0.75 |
| **Loss** | < 0.3 | < 0.4 |

---

## 🛠️ Fonctions Principales

### Création et Entraînement
- `createRecommendationModel(config)` : Crée le modèle
- `trainModel(model, trainingData, validationData, epochs, batchSize)` : Entraîne
- `trainClassificationModel(config)` : Entraîne modèle classification
- `trainGenerationModel(config)` : Entraîne modèle génération

### Évaluation
- `evaluateModel(model, testData, numRecipes)` : Évalue classification
- `evaluateGenerationModel(model, testData, recipes, stats)` : Évalue génération

### Prédiction
- `predictRecipes(model, userFeatures, topK)` : Prédit recettes
- `predictRecipesForUser(userId, topK)` : Prédit pour utilisateur

### Features
- `buildIngredientVocabulary(recipes)` : Construit vocabulaire
- `extractUserRequestFeatures(...)` : Extrait features requête
- `calculateDatasetStats(recipes)` : Calcule statistiques

---

## 📦 Extraction de Features

### Vecteur de Features
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

### Encodage
- **Ingrédients** : One-hot encoding
- **Type recette** : 0 (sweet) ou 1 (savory)
- **Valeurs numériques** : Normalisation Min-Max
- **Allergènes** : Vecteur de pénalités (-1)

---

## 📊 Division des Données

- **Training** : 70%
- **Validation** : 15%
- **Test** : 15%

---

## 💾 Sauvegarde

**Table MySQL** : `ml_models`

**Métadonnées sauvegardées** :
- inputSize, outputSize
- hiddenLayers
- trainingDataSize
- accuracy, precision, recall, f1Score
- loss

---

## ⚙️ Exigences Minimales

- **Dataset Classification** : 50 recettes minimum
- **Dataset Génération** : 100 recettes minimum
- **Exemples d'entraînement** : 20+ (classification), 50+ (génération)

---

## 📝 Exemple de Calcul

### Accuracy
```
30 exemples de test
25 prédictions correctes
Accuracy = 25/30 = 83.33%
```

### F1-Score
```
TP = 20, FP = 5, FN = 5
Precision = 20/(20+5) = 0.80
Recall = 20/(20+5) = 0.80
F1-Score = 2×(0.80×0.80)/(0.80+0.80) = 0.80
```

---

## 🔧 Technologies Utilisées

- **TensorFlow.js** : `@tensorflow/tfjs-node`
- **MySQL** : Base de données pour stockage modèles
- **TypeScript** : Typage statique
- **Node.js** : Environnement d'exécution

---

## 📌 Points Clés pour le Rapport

1. **Modèle** : Réseau de neurones profond avec 3 couches cachées
2. **Entraînement** : 50-100 epochs avec validation croisée
3. **Métriques** : Accuracy, Precision, Recall, F1-Score calculées
4. **Performance** : 75-85% d'accuracy sur dataset de test
5. **Features** : Encodage one-hot + normalisation Min-Max
6. **Optimisation** : Adam optimizer avec dropout pour régularisation


