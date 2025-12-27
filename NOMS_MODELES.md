# Noms des Modèles ML - NutriWise

## 📋 Modèles Utilisés

### 1. Modèle de Classification (Recommandation)

**Nom de la classe Python** : `ClassificationModel`

**Fichier source** : `ml_api/classification_model.py`

**Type de modèle** : Deep Neural Network (DNN) - Classification Multi-Classe

**Objectif** : Recommander des recettes existantes basées sur le profil utilisateur

**Architecture** :
- Type : Réseau de Neurones Profond (Sequential Model)
- Framework : TensorFlow/Keras
- Architecture : [512, 256, 128] neurones
- Paramètres totaux : 1,266,880

**Utilisation dans le code** :
```python
from classification_model import ClassificationModel

model = ClassificationModel()
metrics = model.train(...)
predictions = model.predict(user_features)
```

---

### 2. Modèle de Génération

**Nom de la classe Python** : `GenerationModel`

**Fichier source** : `ml_api/generation_model.py`

**Type de modèle** : Deep Neural Network (DNN) - Classification Multi-Classe

**Objectif** : Générer des recettes personnalisées basées sur les ingrédients disponibles

**Architecture** :
- Type : Réseau de Neurones Profond (Sequential Model)
- Framework : TensorFlow/Keras
- Architecture : [512, 256, 128, 64] neurones
- Paramètres totaux : 763,136

**Utilisation dans le code** :
```python
from generation_model import GenerationModel

model = GenerationModel()
metrics = model.train(...)
predictions = model.predict(user_features)
```

---

## 📊 Résumé Comparatif

| Caractéristique | ClassificationModel | GenerationModel |
|-----------------|---------------------|-----------------|
| **Nom de classe** | `ClassificationModel` | `GenerationModel` |
| **Fichier** | `classification_model.py` | `generation_model.py` |
| **Type** | DNN Multi-Classe | DNN Multi-Classe |
| **Objectif** | Recommandation | Génération |
| **Architecture** | [512, 256, 128] | [512, 256, 128, 64] |
| **Paramètres** | 1,266,880 | 763,136 |
| **Epochs** | 50 | 150 |
| **Learning Rate** | 0.0005 | 0.0003 |

---

## 🔍 Noms dans la Base de Données

Dans la base de données JSON (`ml_api/data.json`), les modèles sont stockés avec ces noms :

- **ClassificationModel** : `model_name = 'recipe_classification'`
- **GenerationModel** : `model_name = 'recipe_generation'`

---

## 📝 Noms dans les Versions Sauvegardées

Lors de la sauvegarde, les modèles utilisent ces préfixes :

- **ClassificationModel** : `classification_v{timestamp}` ou `classification_model{num}_v{timestamp}`
- **GenerationModel** : `generation_v{timestamp}`

---

## ✅ Pour le Rapport LaTeX

Dans votre rapport LaTeX, vous pouvez utiliser :

- **ClassificationModel** (nom technique)
- **Modèle de Classification** (nom descriptif en français)
- **Recipe Classification Model** (nom descriptif en anglais)

- **GenerationModel** (nom technique)
- **Modèle de Génération** (nom descriptif en français)
- **Recipe Generation Model** (nom descriptif en anglais)

