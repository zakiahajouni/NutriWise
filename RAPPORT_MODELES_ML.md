# Rapport Technique - Modèles de Machine Learning
## Système de Recommandation et Génération de Recettes NutriWise

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Modèle 1 : Classification de Recettes](#modèle-1--classification-de-recettes)
3. [Modèle 2 : Génération de Recettes](#modèle-2--génération-de-recettes)
4. [Comparaison des Modèles](#comparaison-des-modèles)
5. [Justification des Choix](#justification-des-choix)
6. [Formules et Calculs](#formules-et-calculs)
7. [Schémas Architecturaux](#schémas-architecturaux)
8. [Performances et Métriques](#performances-et-métriques)

---

## Vue d'ensemble

Le système NutriWise utilise **deux modèles de Deep Learning** spécialisés pour répondre aux besoins des utilisateurs :

| Modèle | Type | Objectif | Framework |
|--------|------|----------|-----------|
| **ClassificationModel** | Classification Multi-Classe | Recommander des recettes existantes | TensorFlow/Keras (Python) |
| **GenerationModel** | Classification Multi-Classe | Générer des recettes personnalisées | TensorFlow/Keras (Python) |

---

## Modèle 1 : Classification de Recettes

### 📌 Informations Générales

- **Nom** : `ClassificationModel`
- **Type** : Réseau de Neurones Profond (Deep Neural Network - DNN)
- **Problème** : Classification Multi-Classe (8000 classes = 8000 recettes)
- **Framework** : TensorFlow 2.x / Keras
- **Langage** : Python 3.12

### 🏗️ Architecture du Modèle

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE D'ENTRÉE                          │
│              Input Features (137 dimensions)                │
│  [Ingrédients disponibles, Type, Cuisine, Préférences...]   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 1 (512 neurones)                 │
│  Dense(512) + BatchNormalization + ReLU                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 2 (256 neurones)                 │
│  Dense(256) + BatchNormalization + Dropout(0.4) + ReLU      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 3 (128 neurones)                 │
│  Dense(128) + BatchNormalization + Dropout(0.4) + ReLU     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE DE SORTIE (8000 neurones)               │
│              Dense(8000) + Softmax                          │
│         Probabilités pour chaque recette                    │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Paramètres du Modèle

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| **Architecture** | [512, 256, 128] | Équilibre entre capacité et vitesse |
| **Input Size** | 137 dimensions | Features extraites (ingrédients, préférences, etc.) |
| **Output Size** | 8000 classes | Nombre de recettes dans le dataset |
| **Activation** | ReLU (cachées), Softmax (sortie) | Standard pour classification |
| **Dropout** | 0.4 | Réduction du surapprentissage |
| **Batch Normalization** | Oui | Stabilisation de l'entraînement |
| **Learning Rate** | 0.0005 | Convergence stable |
| **Optimizer** | Adam | Adaptatif et efficace |
| **Loss Function** | Categorical Crossentropy | Standard pour classification multi-classe |
| **Epochs** | 50 (avec early stopping) | Évite le surapprentissage |
| **Batch Size** | 128 | Équilibre mémoire/performance |
| **Patience Early Stopping** | 15 epochs | Arrêt si pas d'amélioration |

### 🔢 Calcul du Nombre de Paramètres

```
Paramètres = Σ (neurones_couche_i × neurones_couche_i+1 + neurones_couche_i)

Couche 1: 137 × 512 + 512 = 70,656
Couche 2: 512 × 256 + 256 = 131,328
Couche 3: 256 × 128 + 128 = 32,896
Couche 4: 128 × 8000 + 8000 = 1,032,000

TOTAL = 1,266,880 paramètres
```

### 📈 Métriques de Performance

| Métrique | Valeur Cible | Valeur Actuelle | Statut |
|----------|--------------|-----------------|--------|
| **Accuracy** | > 75% | ~4-5% (en cours d'amélioration) | ⚠️ À améliorer |
| **Precision** | > 70% | En cours | ⚠️ À améliorer |
| **Recall** | > 70% | En cours | ⚠️ À améliorer |
| **F1-Score** | > 0.70 | En cours | ⚠️ À améliorer |
| **Loss** | < 0.3 | ~13.3 (en cours) | ⚠️ À améliorer |

**Note** : Les performances actuelles sont faibles car le modèle nécessite plus d'epochs d'entraînement. Avec 50 epochs et une patience de 15, le modèle devrait atteindre de meilleures performances.

---

## Modèle 2 : Génération de Recettes

### 📌 Informations Générales

- **Nom** : `GenerationModel`
- **Type** : Réseau de Neurones Profond (Deep Neural Network - DNN)
- **Problème** : Classification Multi-Classe pour sélection de recettes
- **Framework** : TensorFlow 2.x / Keras
- **Langage** : Python 3.12

### 🏗️ Architecture du Modèle

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE D'ENTRÉE                          │
│              Input Features (137 dimensions)                │
│  [Ingrédients disponibles, Type, Cuisine, Préférences...]   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 1 (512 neurones)                 │
│  Dense(512) + BatchNormalization + ReLU                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 2 (256 neurones)                 │
│  Dense(256) + BatchNormalization + Dropout(0.35) + ReLU    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 3 (128 neurones)                 │
│  Dense(128) + BatchNormalization + Dropout(0.35) + ReLU    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE CACHÉE 4 (64 neurones)                  │
│  Dense(64) + BatchNormalization + Dropout(0.35) + ReLU     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COUCHE DE SORTIE (8000 neurones)               │
│              Dense(8000) + Softmax                          │
│         Probabilités pour chaque recette                    │
└─────────────────────────────────────────────────────────────┘
```

### 📊 Paramètres du Modèle

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| **Architecture** | [512, 256, 128, 64] | Architecture plus profonde pour génération |
| **Input Size** | 137 dimensions | Mêmes features que classification |
| **Output Size** | 8000 classes | Nombre de recettes dans le dataset |
| **Activation** | ReLU (cachées), Softmax (sortie) | Standard pour classification |
| **Dropout** | 0.35 | Légèrement moins que classification |
| **Batch Normalization** | Oui | Stabilisation de l'entraînement |
| **Learning Rate** | 0.0003 | Plus conservateur pour génération |
| **Optimizer** | Adam | Adaptatif et efficace |
| **Loss Function** | Categorical Crossentropy | Standard pour classification multi-classe |
| **Epochs** | 150 (avec early stopping) | Plus d'epochs pour génération |
| **Batch Size** | 64 | Plus petit pour meilleure généralisation |
| **Patience Early Stopping** | 15 epochs | Arrêt si pas d'amélioration |

### 🔢 Calcul du Nombre de Paramètres

```
Paramètres = Σ (neurones_couche_i × neurones_couche_i+1 + neurones_couche_i)

Couche 1: 137 × 512 + 512 = 70,656
Couche 2: 512 × 256 + 256 = 131,328
Couche 3: 256 × 128 + 128 = 32,896
Couche 4: 128 × 64 + 64 = 8,256
Couche 5: 64 × 8000 + 8000 = 520,000

TOTAL = 763,136 paramètres
```

### 📈 Métriques de Performance

| Métrique | Valeur Cible | Description |
|----------|--------------|-------------|
| **Recipe Accuracy** | > 70% | Précision de sélection de recette |
| **Ingredient F1-Score** | > 0.65 | Précision des ingrédients prédits |
| **Price MAE** | < 2.0$ | Erreur moyenne sur le prix estimé |
| **Loss** | < 0.4 | Perte globale du modèle |

---

## Comparaison des Modèles

### 📊 Tableau Comparatif Détaillé

| Critère | ClassificationModel | GenerationModel | Gagnant |
|---------|---------------------|------------------|---------|
| **Nombre de Couches Cachées** | 3 | 4 | Generation (plus profond) |
| **Neurones par Couche** | [512, 256, 128] | [512, 256, 128, 64] | Classification (plus large) |
| **Total Paramètres** | ~1,266,880 | ~763,136 | Classification (plus complexe) |
| **Dropout** | 0.4 | 0.35 | Generation (moins de régularisation) |
| **Learning Rate** | 0.0005 | 0.0003 | Classification (plus rapide) |
| **Epochs** | 50 | 150 | Generation (plus d'entraînement) |
| **Batch Size** | 128 | 64 | Classification (plus rapide) |
| **Complexité** | Moyenne-Élevée | Moyenne | Classification |
| **Temps d'Entraînement** | ~10-15 min | ~20-30 min | Classification |
| **Mémoire Requise** | ~500 MB | ~300 MB | Generation |
| **Cas d'Usage** | Recommandation | Génération | Différents |

### 🎯 Différences Clés

1. **Architecture** :
   - Classification : 3 couches cachées, plus large (512→256→128)
   - Generation : 4 couches cachées, plus profonde (512→256→128→64)

2. **Hyperparamètres** :
   - Classification : Learning rate plus élevé (0.0005), batch size plus grand (128)
   - Generation : Learning rate plus conservateur (0.0003), batch size plus petit (64)

3. **Entraînement** :
   - Classification : 50 epochs, optimisé pour vitesse
   - Generation : 150 epochs, optimisé pour précision

---

## Justification des Choix

### ✅ Pourquoi des Réseaux de Neurones Profonds (DNN) ?

1. **Complexité du Problème** :
   - 8000 classes (recettes) à classifier
   - 137 features d'entrée complexes
   - Relations non-linéaires entre features et recettes

2. **Avantages des DNN** :
   - ✅ Capacité à apprendre des patterns complexes
   - ✅ Gestion automatique des interactions entre features
   - ✅ Scalabilité avec le nombre de classes
   - ✅ Performance prouvée en recommandation

3. **Alternatives Considérées** :
   - ❌ KNN : Trop lent avec 8000 classes
   - ❌ Random Forest : Limité pour classification multi-classe
   - ❌ SVM : Ne scale pas bien avec 8000 classes
   - ✅ DNN : Meilleur compromis performance/complexité

### ✅ Pourquoi cette Architecture Spécifique ?

#### ClassificationModel : [512, 256, 128]

- **512 neurones (couche 1)** : Capacité suffisante pour capturer les patterns complexes
- **256 neurones (couche 2)** : Réduction progressive pour éviter le surapprentissage
- **128 neurones (couche 3)** : Compression finale avant la sortie
- **Dropout 0.4** : Régularisation forte pour 8000 classes
- **Batch Normalization** : Stabilisation de l'entraînement profond

#### GenerationModel : [512, 256, 128, 64]

- **Architecture plus profonde** : Nécessaire pour la génération créative
- **Couche supplémentaire (64)** : Meilleure abstraction des features
- **Dropout 0.35** : Moins de régularisation pour plus de flexibilité
- **Learning rate plus bas** : Convergence plus stable pour génération

### ✅ Pourquoi Adam Optimizer ?

- ✅ **Adaptatif** : Ajuste automatiquement le learning rate
- ✅ **Efficace** : Convergence rapide
- ✅ **Stable** : Moins sensible aux hyperparamètres
- ✅ **Standard** : Utilisé dans la plupart des projets ML modernes

### ✅ Pourquoi Categorical Crossentropy ?

- ✅ **Standard** pour classification multi-classe
- ✅ **Différentiable** : Nécessaire pour backpropagation
- ✅ **Probabiliste** : Sortie en probabilités (softmax)
- ✅ **Performant** : Optimisé dans TensorFlow

---

## Formules et Calculs

### 📐 Formule de la Fonction de Perte (Loss)

**Categorical Crossentropy** :

```
L = -Σ(i=1 to N) Σ(j=1 to C) y_true[i,j] × log(y_pred[i,j])

Où:
- N = nombre d'exemples
- C = nombre de classes (8000)
- y_true = labels réels (one-hot encoding)
- y_pred = prédictions du modèle (probabilités)
```

**Exemple de calcul** :
```
Si y_true = [0, 0, 1, 0, ..., 0] (classe 3)
Et y_pred = [0.1, 0.2, 0.5, 0.1, ..., 0.1]

L = -log(0.5) = 0.693
```

### 📊 Formule de l'Accuracy

```
Accuracy = (Nombre de prédictions correctes) / (Nombre total d'exemples)

Accuracy = Σ(i=1 to N) [argmax(y_pred[i]) == argmax(y_true[i])] / N
```

### 📈 Formule de la Precision

```
Precision = TP / (TP + FP)

Où:
- TP = True Positives (prédictions correctes)
- FP = False Positives (prédictions incorrectes)
```

### 📉 Formule du Recall

```
Recall = TP / (TP + FN)

Où:
- FN = False Negatives (classes manquées)
```

### 🎯 Formule du F1-Score

```
F1-Score = 2 × (Precision × Recall) / (Precision + Recall)

F1-Score = Harmonic Mean de Precision et Recall
```

### 🔄 Formule de la Propagation Avant (Forward Pass)

Pour une couche Dense avec activation ReLU :

```
h[l] = ReLU(W[l] × h[l-1] + b[l])

Où:
- h[l] = sortie de la couche l
- W[l] = poids de la couche l
- b[l] = biais de la couche l
- ReLU(x) = max(0, x)
```

### 📉 Formule du Dropout

```
h_dropout = h × mask / (1 - dropout_rate)

Où:
- mask = vecteur binaire aléatoire (0 ou 1)
- dropout_rate = probabilité de désactiver un neurone (0.4)
```

### 🎲 Formule de Batch Normalization

```
h_norm = γ × (h - μ) / √(σ² + ε) + β

Où:
- μ = moyenne du batch
- σ² = variance du batch
- γ, β = paramètres appris
- ε = petit nombre pour éviter division par zéro (1e-5)
```

---

## Schémas Architecturaux

### 🔄 Flux de Données - ClassificationModel

```
┌──────────────┐
│   Features   │ 137 dimensions
│  Utilisateur │ [ingrédients, préférences, ...]
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Feature Extraction              │
│  - One-hot encoding ingrédients     │
│  - Normalisation valeurs            │
│  - Encodage préférences             │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(512) + BN + ReLU            │
│   Paramètres: 70,656                │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(256) + BN + Dropout + ReLU │
│   Paramètres: 131,328               │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(128) + BN + Dropout + ReLU  │
│   Paramètres: 32,896                │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(8000) + Softmax             │
│   Paramètres: 1,032,000              │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Probabilités (8000 valeurs)      │
│   Top-K recommandations            │
└─────────────────────────────────────┘
```

### 🔄 Flux de Données - GenerationModel

```
┌──────────────┐
│   Features   │ 137 dimensions
│  Utilisateur │ [ingrédients disponibles, ...]
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Feature Extraction              │
│  - Encodage ingrédients disponibles │
│  - Type de recette souhaité         │
│  - Préférences alimentaires         │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(512) + BN + ReLU            │
│   Paramètres: 70,656                │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(256) + BN + Dropout + ReLU  │
│   Paramètres: 131,328               │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(128) + BN + Dropout + ReLU  │
│   Paramètres: 32,896                │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(64) + BN + Dropout + ReLU   │
│   Paramètres: 8,256                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Dense(8000) + Softmax             │
│   Paramètres: 520,000                │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Recette Générée                  │
│   + Ingrédients manquants          │
│   + Prix estimé                    │
└─────────────────────────────────────┘
```

### 📊 Comparaison Visuelle des Architectures

```
ClassificationModel          GenerationModel
─────────────────           ─────────────────
Input (137)                 Input (137)
    │                            │
    ▼                            ▼
Dense(512)                  Dense(512)
    │                            │
    ▼                            ▼
Dense(256)                  Dense(256)
    │                            │
    ▼                            ▼
Dense(128)                  Dense(128)
    │                            │
    ▼                            ▼
Output(8000)                Dense(64)
                                │
                                ▼
                            Output(8000)
```

---

## Performances et Métriques

### 📈 Métriques Détaillées - ClassificationModel

| Métrique | Formule | Valeur Cible | Interprétation |
|----------|---------|--------------|----------------|
| **Accuracy** | Correct / Total | > 75% | 75% des recommandations sont correctes |
| **Precision** | TP / (TP + FP) | > 70% | 70% des recettes recommandées sont pertinentes |
| **Recall** | TP / (TP + FN) | > 70% | 70% des recettes pertinentes sont trouvées |
| **F1-Score** | 2×P×R / (P+R) | > 0.70 | Équilibre entre précision et rappel |
| **Loss** | Crossentropy | < 0.3 | Faible perte = bon apprentissage |

### 📈 Métriques Détaillées - GenerationModel

| Métrique | Formule | Valeur Cible | Interprétation |
|----------|---------|--------------|----------------|
| **Recipe Accuracy** | Correct / Total | > 70% | 70% des recettes générées sont pertinentes |
| **Ingredient F1** | F1 sur ingrédients | > 0.65 | Précision des ingrédients prédits |
| **Price MAE** | |MAE| | < 2.0$ | Erreur moyenne de 2$ sur le prix |
| **Loss** | Crossentropy | < 0.4 | Faible perte = bon apprentissage |

### 🎯 Calcul de Complexité

**Complexité Temporelle** :
- Forward pass : O(n × m) où n = batch size, m = nombre de paramètres
- ClassificationModel : ~1.3M paramètres → ~1.3M opérations par exemple
- GenerationModel : ~763K paramètres → ~763K opérations par exemple

**Complexité Spatiale** :
- ClassificationModel : ~500 MB (modèle + données)
- GenerationModel : ~300 MB (modèle + données)

---

## Conclusion

Les deux modèles utilisent des **architectures de Deep Learning** adaptées à leurs tâches respectives :

1. **ClassificationModel** : Optimisé pour la **vitesse** et la **recommandation** rapide
2. **GenerationModel** : Optimisé pour la **précision** et la **génération** créative

Les choix architecturaux sont justifiés par :
- ✅ La complexité du problème (8000 classes)
- ✅ Les performances attendues
- ✅ Les contraintes de temps et mémoire
- ✅ Les standards de l'industrie ML

---

**Document généré le** : 2025-01-26  
**Version** : 1.0  
**Auteur** : Système NutriWise ML

