#!/bin/bash
# Script pour entraîner les trois modèles de classification

# Aller dans le répertoire ml_api
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Activer l'environnement virtuel si nécessaire
if [ -d "venv" ]; then
    echo "🔧 Activation de l'environnement virtuel..."
    source venv/bin/activate
fi

# Vérifier que Python peut importer les modules nécessaires
echo "🔍 Vérification des dépendances..."
python3 -c "import tensorflow; import sklearn; print('✅ Dépendances OK')" 2>/dev/null || {
    echo "❌ Erreur: TensorFlow ou scikit-learn non installé"
    echo "   Veuillez installer les dépendances: pip install tensorflow scikit-learn"
    exit 1
}

# Exécuter le script Python
echo "🚀 Démarrage de l'entraînement des trois modèles..."
python3 train_three_models.py

