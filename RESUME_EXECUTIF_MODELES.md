# Résumé Exécutif - Modèles ML NutriWise

## 🎯 Vue d'Ensemble

Le système NutriWise utilise **2 modèles de Deep Learning** pour la recommandation et la génération de recettes :

| Modèle | Type | Objectif | Framework |
|--------|------|----------|-----------|
| **ClassificationModel** | DNN Multi-Classe | Recommander recettes | TensorFlow/Keras |
| **GenerationModel** | DNN Multi-Classe | Générer recettes | TensorFlow/Keras |

---

## 📊 Caractéristiques Principales

### ClassificationModel (Recommandation)

- **Architecture** : [512, 256, 128] → **1,266,880 paramètres**
- **Epochs** : 50 (avec early stopping)
- **Learning Rate** : 0.0005
- **Dropout** : 0.4
- **Batch Size** : 128
- **Temps d'entraînement** : ~10-15 minutes
- **Mémoire** : ~500 MB

### GenerationModel (Génération)

- **Architecture** : [512, 256, 128, 64] → **763,136 paramètres**
- **Epochs** : 150 (avec early stopping)
- **Learning Rate** : 0.0003
- **Dropout** : 0.35
- **Batch Size** : 64
- **Temps d'entraînement** : ~20-30 minutes
- **Mémoire** : ~300 MB

---

## 🎯 Performances Cibles

| Métrique | ClassificationModel | GenerationModel |
|----------|---------------------|-----------------|
| **Accuracy** | > 75% | > 70% |
| **Precision** | > 70% | N/A |
| **Recall** | > 70% | N/A |
| **F1-Score** | > 0.70 | > 0.65 |
| **Loss** | < 0.3 | < 0.4 |

---

## ✅ Pourquoi ces Modèles ?

1. **DNN Multi-Classe** : Adapté à 8000 classes (recettes)
2. **Architecture Profonde** : Capture les patterns complexes
3. **TensorFlow/Keras** : Framework standard et performant
4. **Optimisations** : Batch Normalization, Dropout, Early Stopping

---

## 📈 Comparaison Rapide

| Critère | ClassificationModel | GenerationModel |
|---------|---------------------|-----------------|
| **Complexité** | Plus complexe (1.3M params) | Moins complexe (763K params) |
| **Vitesse** | Plus rapide (10-15 min) | Plus lent (20-30 min) |
| **Mémoire** | Plus (500 MB) | Moins (300 MB) |
| **Profondeur** | 3 couches cachées | 4 couches cachées |

---

## 🔧 Technologies Utilisées

- **Framework** : TensorFlow 2.x / Keras
- **Langage** : Python 3.12
- **Optimiseur** : Adam
- **Loss** : Categorical Crossentropy
- **Activation** : ReLU (cachées), Softmax (sortie)

---

## 📚 Documents Complets

Pour plus de détails, consulter :
- **RAPPORT_MODELES_ML.md** : Rapport technique complet
- **TABLEAUX_COMPARATIFS_MODELES.md** : Tableaux détaillés

---

**Version** : 1.0  
**Date** : 2025-01-26

