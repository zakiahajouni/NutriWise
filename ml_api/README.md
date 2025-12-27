# API ML Python - NutriWise

API Python pour le Machine Learning de NutriWise utilisant **TensorFlow/Keras** et un **fichier JSON statique** comme base de données (idéal pour l'hébergement).

## Architecture

### Structure des fichiers

```
ml_api/
├── app.py                    # API Flask principale
├── database.py               # Connexion MySQL et fonctions DB
├── dataset_loader.py         # Chargement des recettes depuis MySQL
├── feature_extractor.py      # Extraction de features pour ML
├── classification_model.py   # Modèle de classification (recommandations)
├── generation_model.py       # Modèle de génération (création de recettes)
├── requirements.txt          # Dépendances Python
└── README.md                 # Documentation
```

## Installation

### 1. Créer un environnement virtuel

```bash
cd ml_api
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` dans `ml_api/` :

```env
DB_HOST=localhost
DB_USER=nutriwise
DB_PASSWORD=nutriwise123
DB_NAME=nutriwise
DB_PORT=3306
PORT=5000
```

## Utilisation

### Démarrer l'API

```bash
python app.py
```

L'API sera accessible sur `http://localhost:5000`

### Routes disponibles

#### Health Check
```
GET /health
```

#### Prédiction de profil
```
POST /api/ml/predict-profile
Body: { "userId": 1 }
```

#### Suggestions de recettes
```
POST /api/ml/suggest-recipes
Body: { "userId": 1 }
```

#### Génération de recette
```
POST /api/ml/generate-meal
Body: {
  "recipeType": "savory",
  "availableIngredients": ["chicken", "rice", "garlic"],
  "allergies": [],
  "dietaryPreference": "normal",
  "cuisineType": "Italian",
  "isHealthy": false
}
```

#### Entraînement du modèle de classification
```
POST /api/ml/train-classification
Body: {
  "epochs": 200,
  "batchSize": 128,
  "learningRate": 0.0004,
  "hiddenLayers": [512, 512, 256, 128, 64],
  "dropout": 0.4
}
```

#### Entraînement du modèle de génération
```
POST /api/ml/train-generation
Body: {
  "epochs": 150,
  "batchSize": 64,
  "learningRate": 0.0003,
  "hiddenLayers": [512, 256, 128, 64],
  "dropout": 0.35
}
```

## Modèles ML

### Modèle de Classification

- **Architecture**: Réseau de neurones profond avec batch normalization
- **Couches**: [512, 512, 256, 128, 64] neurones
- **Activation**: ReLU + Softmax
- **Optimiseur**: Adam
- **Loss**: Categorical Crossentropy
- **Métriques**: Accuracy, Precision, Recall, F1-Score

### Modèle de Génération

- **Architecture**: Réseau de neurones profond
- **Couches**: [512, 256, 128, 64] neurones
- **Activation**: ReLU + Softmax
- **Optimiseur**: Adam
- **Loss**: Categorical Crossentropy
- **Métriques**: Recipe Accuracy, Ingredient F1, Price MAE

## Base de données

L'API utilise un **fichier JSON statique** (`data.json`) pour :
- Charger les recettes
- Charger les profils utilisateurs
- Charger les interactions
- Sauvegarder les modèles ML (encodés en base64)

**Avantages pour l'hébergement** :
- Pas besoin de configurer MySQL
- Fichier simple à déployer
- Parfait pour Render, Heroku, etc.

### Initialiser le fichier data.json

Pour charger les recettes depuis le dataset :

```bash
python init_data.py
```

Cela va créer `data.json` avec toutes les recettes du fichier `data/recipes_dataset.json`.

## Dépendances principales

- **Flask**: Framework web
- **TensorFlow/Keras**: Deep learning
- **scikit-learn**: Métriques ML
- **mysql-connector-python**: Connexion MySQL
- **numpy/pandas**: Traitement de données

## Notes importantes

1. Les modèles sont sauvegardés dans la table `ml_models` de MySQL
2. Un seul modèle actif par type (classification/generation)
3. Les modèles sont chargés à la demande (lazy loading)
4. Fallback automatique vers algorithme simple si modèle non disponible
