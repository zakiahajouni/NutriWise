#!/bin/bash
# Script pour entraîner un modèle (active automatiquement le venv)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Activer l'environnement virtuel
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Erreur: Environnement virtuel non trouvé!"
    echo "   Créez-le avec: python3 -m venv venv"
    exit 1
fi

# Vérifier que TensorFlow est installé
python3 -c "import tensorflow" 2>/dev/null || {
    echo "❌ Erreur: TensorFlow non installé dans le venv"
    echo "   Installez-le avec: pip install tensorflow scikit-learn"
    exit 1
}

# Exécuter le script Python avec les arguments passés
python3 train_one_model.py "$@"





