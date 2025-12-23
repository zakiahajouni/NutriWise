# Explication du Système ML - NutriWise

## Vue d'ensemble

Le système de recommandation de recettes de NutriWise utilise une approche hybride combinant :
1. **Système de scoring intelligent** (utilisé par défaut)
2. **Modèle TensorFlow.js** (optionnel, nécessite entraînement)

## Comment ça fonctionne actuellement

### 1. Système de Scoring Intelligent (Par défaut)

Le système principal utilise un algorithme de scoring basé sur plusieurs critères :

#### Étape 1 : Chargement des recettes
- Les recettes sont chargées depuis la base de données MySQL (`recipe_templates`)
- Filtrage initial selon : type (sweet/savory), cuisine, santé

#### Étape 2 : Filtrage strict
```typescript
// Critères obligatoires :
- Type de recette DOIT correspondre (sweet ou savory)
- Pas d'allergènes dans la recette
- Respect des préférences alimentaires (végétarien, végan, etc.)
```

#### Étape 3 : Calcul de similarité d'ingrédients
Le système calcule la similarité entre les ingrédients disponibles et ceux de chaque recette :

```typescript
similarité = (correspondances_exactes + correspondances_partielles * 0.5) / total_ingrédients
```

**Exemple :**
- Ingrédients disponibles : ["chicken", "rice", "garlic"]
- Recette nécessite : ["chicken breast", "rice", "onion", "garlic"]
- Correspondances exactes : "rice", "garlic" = 2
- Correspondances partielles : "chicken" contient "chicken breast" = 1 (poids 0.5)
- Total ingrédients uniques : 5
- Similarité = (2 + 1*0.5) / 5 = 0.5

#### Étape 4 : Calcul du score final
Le score combine plusieurs facteurs :

| Critère | Poids | Description |
|---------|-------|-------------|
| Similarité ingrédients | 50% | Correspondance entre ingrédients disponibles et nécessaires |
| Type de recette | 20% | DOIT correspondre (sweet/savory) |
| Type de cuisine | 15% | Bonus si correspond, pénalité si non |
| Préférence santé | 10% | Healthy/unhealthy |
| Allergènes | -50% | Pénalité FORTE si allergènes présents |
| Budget | 5% | Bonus si dans le budget |
| Ingrédients complets | 5% | Bonus si tous les ingrédients disponibles |

**Score final = (similarité × 0.5) + bonus - pénalités**

#### Étape 5 : Sélection de la meilleure recette
- Les recettes sont triées par score décroissant
- La recette avec le score le plus élevé est sélectionnée
- Si plusieurs recettes ont le même score, la première est choisie

### 2. Modèle TensorFlow.js (Optionnel)

Le modèle ML utilise un réseau de neurones profond :

#### Architecture
```
Input Layer (features)
  ↓
Hidden Layer 1 (128 neurones, ReLU)
  ↓
Dropout (30%)
  ↓
Hidden Layer 2 (64 neurones, ReLU)
  ↓
Dropout (30%)
  ↓
Hidden Layer 3 (32 neurones, ReLU)
  ↓
Output Layer (softmax) - Probabilités pour chaque recette
```

#### Features extraites
- **Ingrédients** : Encodage one-hot (vocabulaire dynamique)
- **Type de recette** : 0 (sweet) ou 1 (savory)
- **Type de cuisine** : Encodage one-hot
- **Calories** : Normalisées entre 0 et 1
- **Prix** : Normalisé entre 0 et 1
- **Temps** : Normalisés
- **Santé** : 0 ou 1
- **Allergies** : Vecteur de pénalités (-1 pour chaque allergène)

#### Entraînement
Le modèle nécessite :
- Minimum 50 recettes pour classification
- Minimum 100 recettes pour génération
- Données d'entraînement synthétiques ou réelles (interactions utilisateur)

## Pourquoi le système peut se tromper

### Problèmes identifiés

1. **Dataset avec variations**
   - Le dataset contient des "variations" de recettes qui polluent les données
   - Exemple : "Spaghetti Carbonara (Variation 2)", "Spaghetti Carbonara (Variation 3)"
   - Ces variations créent de la confusion dans le scoring

2. **Similarité d'ingrédients insuffisante**
   - L'ancien système utilisait seulement Jaccard similarity
   - Ne détectait pas les correspondances partielles (ex: "chicken" vs "chicken breast")

3. **Scoring trop simple**
   - Les poids n'étaient pas optimaux
   - Pas assez de pénalités pour les critères importants

4. **Filtrage insuffisant**
   - Le système pouvait suggérer des recettes avec allergènes
   - Ne respectait pas toujours les préférences alimentaires

## Améliorations apportées

### 1. Similarité améliorée
- Détection de correspondances partielles
- Poids réduit pour les correspondances partielles (0.5)
- Meilleure détection des ingrédients similaires

### 2. Scoring amélioré
- Poids augmenté pour la similarité d'ingrédients (50% au lieu de 40%)
- Pénalités fortes pour les critères obligatoires non respectés
- Bonus pour avoir tous les ingrédients disponibles

### 3. Filtrage strict
- Vérification obligatoire du type de recette
- Exclusion stricte des allergènes
- Respect garanti des préférences alimentaires

### 4. Détection d'ingrédients manquants améliorée
- Correspondance partielle pour détecter "chicken" = "chicken breast"
- Réduction des faux positifs

## Utilisation

### Génération de recette simple
```typescript
const recipe = await generateRecipe({
  recipeType: 'savory',
  availableIngredients: ['chicken', 'rice', 'garlic'],
  canPurchase: true,
  budget: 30,
  allergies: ['nuts'],
  cuisineType: 'Italian',
  isHealthy: true,
  dietaryPreference: 'normal'
})
```

### Avec modèle ML (si entraîné)
Le système utilise automatiquement le modèle TensorFlow.js s'il est disponible et activé dans la base de données.

## Recommandations pour améliorer encore

1. **Nettoyer le dataset**
   - Supprimer les variations de recettes
   - Garder une seule version de chaque recette

2. **Augmenter le dataset**
   - Ajouter plus de recettes variées
   - Assurer une bonne répartition par cuisine et type

3. **Entraîner le modèle ML**
   - Utiliser `/api/ml/train-classification` pour entraîner
   - Le modèle ML peut être plus précis que le scoring simple

4. **Collecter des interactions utilisateur**
   - Enregistrer les likes/dislikes
   - Utiliser ces données pour améliorer le modèle

## Fichiers clés

- `lib/ml/recipeGenerator.ts` : Système de scoring principal
- `lib/ml/advancedRecipeGenerator.ts` : Intégration TensorFlow.js
- `lib/ml/datasetLoader.ts` : Chargement des recettes depuis DB
- `lib/ml/featureExtractor.ts` : Extraction de features pour ML
- `lib/ml/tensorflowModel.ts` : Modèle TensorFlow.js

## Performance attendue

- **Système de scoring** : Précision ~75-85%
- **Modèle ML entraîné** : Précision ~80-90%
- **Temps de réponse** : < 100ms

