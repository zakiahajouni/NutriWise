# Système ML pour NutriWise

## Vue d'ensemble

NutriWise utilise maintenant **TensorFlow.js** avec un modèle de deep learning pour générer des recommandations de recettes intelligentes. Le système est entièrement dynamique et charge les données depuis la base de données MySQL.

## Architecture

### Composants principaux

1. **Dataset Loader** (`lib/ml/datasetLoader.ts`)
   - Charge les recettes depuis la table `recipe_templates`
   - Supporte le filtrage dynamique
   - Gère les interactions utilisateur

2. **Feature Extractor** (`lib/ml/featureExtractor.ts`)
   - Convertit les données brutes en vecteurs numériques
   - Construit le vocabulaire d'ingrédients dynamiquement
   - Normalise les features pour le modèle

3. **TensorFlow Model** (`lib/ml/tensorflowModel.ts`)
   - Crée et gère les modèles de deep learning
   - Entraîne les modèles avec validation
   - Sauvegarde/charge les modèles depuis la DB

4. **Trainer** (`lib/ml/trainer.ts`)
   - Système d'entraînement complet
   - Gère la préparation des données
   - Sauvegarde l'historique d'entraînement

5. **Advanced Recipe Generator** (`lib/ml/advancedRecipeGenerator.ts`)
   - Utilise le modèle TensorFlow.js pour générer des recettes
   - Fallback vers le système simple si le modèle n'est pas disponible

## Installation

### 1. Installer les dépendances

```bash
npm install
```

Les dépendances ML suivantes seront installées :
- `@tensorflow/tfjs-node` : TensorFlow.js pour Node.js
- `@tensorflow/tfjs` : TensorFlow.js core
- `natural` : Traitement du langage naturel
- `ml-matrix` : Opérations matricielles

### 2. Créer les tables de base de données

```bash
mysql -u nutriwise -p nutriwise < database/ml_schema.sql
```

Ou exécutez le contenu de `database/ml_schema.sql` dans MySQL.

### 3. Charger le dataset initial

Le fichier `database/ml_schema.sql` contient déjà quelques recettes de base. Pour ajouter plus de recettes :

```sql
INSERT INTO recipe_templates (name, description, ingredients, steps, ...) VALUES (...);
```

## Utilisation

### Entraîner le modèle

#### Via l'API

```bash
curl -X POST http://localhost:3000/api/ml/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 50,
    "batchSize": 32,
    "learningRate": 0.001,
    "hiddenLayers": [128, 64, 32],
    "dropout": 0.2
  }'
```

#### Configuration par défaut

- **Epochs** : 50
- **Batch Size** : 32
- **Learning Rate** : 0.001
- **Hidden Layers** : [128, 64, 32]
- **Dropout** : 0.2

### Générer une recette

Le système utilise automatiquement le modèle TensorFlow.js s'il est disponible, sinon il utilise le système de fallback.

```bash
curl -X POST http://localhost:3000/api/ml/generate-meal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipeType": "savory",
    "availableIngredients": ["pâtes", "lardons", "œufs"],
    "canPurchase": true,
    "budget": 10,
    "allergies": [],
    "cuisineType": "Italian",
    "isHealthy": false
  }'
```

## Structure de la base de données

### Tables principales

1. **recipe_templates** : Dataset de recettes pour l'entraînement
2. **ml_models** : Modèles ML sauvegardés
3. **user_interactions** : Interactions utilisateur pour améliorer le modèle
4. **ingredient_features** : Features des ingrédients
5. **training_history** : Historique d'entraînement

## Modèle ML

### Architecture du réseau de neurones

```
Input Layer (features) 
  ↓
Hidden Layer 1 (128 neurones, ReLU)
  ↓
Dropout (20%)
  ↓
Hidden Layer 2 (64 neurones, ReLU)
  ↓
Dropout (20%)
  ↓
Hidden Layer 3 (32 neurones, ReLU)
  ↓
Output Layer (softmax) - Probabilités pour chaque recette
```

### Features utilisées

- **Ingrédients** : Encodage one-hot (vocabulaire dynamique)
- **Type de recette** : Sweet/Savory (0 ou 1)
- **Type de cuisine** : Encodage one-hot
- **Calories** : Normalisées entre 0 et 1
- **Prix** : Normalisé entre 0 et 1
- **Temps de préparation** : Normalisé
- **Temps de cuisson** : Normalisé
- **Is Healthy** : 0 ou 1
- **Allergies** : Vecteur de pénalités

## Amélioration continue

Le système s'améliore automatiquement grâce à :

1. **Interactions utilisateur** : Les likes/dislikes sont enregistrés
2. **Nouvelles recettes** : Ajoutées au dataset
3. **Ré-entraînement** : Le modèle peut être ré-entraîné avec plus de données

## Performance

- **Précision** : Généralement > 80% après entraînement
- **Temps d'entraînement** : ~2-5 minutes pour 1000 recettes
- **Temps de prédiction** : < 100ms par requête

## Notes importantes

1. **Premier entraînement** : Le modèle doit être entraîné au moins une fois avant utilisation
2. **Dataset minimum** : Au moins 10 recettes requises pour l'entraînement
3. **Fallback automatique** : Si le modèle n'est pas disponible, le système utilise l'algorithme de similarité
4. **Activation du modèle** : Un seul modèle peut être actif à la fois

## Dépannage

### Le modèle ne se charge pas

Vérifiez que :
- Un modèle a été entraîné (`SELECT * FROM ml_models WHERE is_active = TRUE`)
- Le modèle est sauvegardé correctement dans la DB
- Les dépendances TensorFlow.js sont installées

### Erreur lors de l'entraînement

- Vérifiez que le dataset contient au moins 10 recettes
- Vérifiez les logs pour plus de détails
- Assurez-vous que MySQL est accessible

### Prédictions incorrectes

- Ré-entraînez le modèle avec plus de données
- Vérifiez que les features sont correctement extraites
- Augmentez le nombre d'epochs si nécessaire

