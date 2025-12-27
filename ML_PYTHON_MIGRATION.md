# Migration ML vers Python

## ✅ Corrections Apportées

Le système ML a été migré de JavaScript/TypeScript (TensorFlow.js) vers **Python** avec Flask.

## Architecture

### Structure
```
ml_api/
├── app.py              # API Flask principale
├── requirements.txt    # Dépendances Python
├── README.md          # Documentation
└── .env.example       # Exemple de configuration
```

### Routes Next.js Modifiées

Toutes les routes ML dans `app/api/ml/` appellent maintenant l'API Python via `lib/ml_api_client.ts` :

- ✅ `/api/ml/generate-meal` → Appelle `POST /api/ml/generate-meal` (Python)
- ✅ `/api/ml/suggest-recipes` → Appelle `POST /api/ml/suggest-recipes` (Python)
- ✅ `/api/ml/predict-profile` → Appelle `POST /api/ml/predict-profile` (Python)
- ✅ `/api/ml/train-classification` → Appelle `POST /api/ml/train-classification` (Python)
- ✅ `/api/ml/train-generation` → Appelle `POST /api/ml/train-generation` (Python)

## Installation

### 1. Installer Python et dépendances

```bash
cd ml_api
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurer les variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```env
DB_HOST=localhost
DB_USER=nutriwise
DB_PASSWORD=nutriwise123
DB_NAME=nutriwise
DB_PORT=3306
PORT=5000
```

### 3. Démarrer l'API Python

```bash
python app.py
```

L'API sera accessible sur `http://localhost:5000`

## Configuration Next.js

Ajouter la variable d'environnement dans `.env.local` :

```env
ML_API_URL=http://localhost:5000
```

Pour la production (Render), configurer :

```env
ML_API_URL=https://votre-api-ml-python.onrender.com
```

## Déploiement sur Render

### 1. Créer un service Python sur Render

1. Créer un nouveau service "Web Service"
2. Connecter votre repo GitHub
3. Configurer :
   - **Build Command**: `pip install -r ml_api/requirements.txt`
   - **Start Command**: `cd ml_api && python app.py`
   - **Environment**: Python 3

### 2. Variables d'environnement sur Render

Dans votre service Python ML :
```
DB_HOST=votre-host-mysql.render.com
DB_USER=votre-utilisateur
DB_PASSWORD=votre-mot-de-passe
DB_NAME=nutriwise
DB_PORT=3306
PORT=5000
```

Dans votre service Next.js :
```
ML_API_URL=https://votre-api-ml-python.onrender.com
```

## Technologies Utilisées

- **Flask** : Framework web Python
- **scikit-learn** : Modèles ML classiques
- **TensorFlow** : Deep learning (si nécessaire)
- **MySQL Connector** : Connexion à la base de données
- **flask-cors** : Autoriser les requêtes depuis Next.js

## Prochaines Étapes

1. ✅ API Flask créée
2. ✅ Routes Next.js modifiées
3. ⏳ Implémenter les vrais modèles ML en Python (scikit-learn/TensorFlow)
4. ⏳ Ajouter l'entraînement des modèles
5. ⏳ Sauvegarder les modèles entraînés

## Notes

- Les anciens fichiers TypeScript ML (`lib/ml/*.ts`) sont toujours présents mais ne sont plus utilisés
- L'API Python peut être déployée séparément du service Next.js
- En cas d'indisponibilité de l'API Python, les routes Next.js retournent des erreurs appropriées

