#!/bin/bash
# Script pour entraîner les modèles depuis le terminal (évite le blocage de l'IDE)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Activer l'environnement virtuel
if [ -d "venv" ]; then
    echo "🔧 Activation de l'environnement virtuel..."
    source venv/bin/activate
fi

# Vérifier les dépendances
echo "🔍 Vérification des dépendances..."
python3 -c "import tensorflow; import sklearn; print '✅ Dépendances OK'" 2>/dev/null || {
    echo "❌ Erreur: TensorFlow ou scikit-learn non installé"
    echo "   Veuillez installer les dépendances: pip install tensorflow scikit-learn"
    exit 1
}

echo ""
echo "="*80
echo "ENTRAÎNEMENT DES MODÈLES DE CLASSIFICATION"
echo "="*80
echo ""
echo "⚠️  IMPORTANT: Ce script doit être exécuté depuis le TERMINAL, pas depuis l'IDE"
echo "📝 Les résultats seront affichés dans ce terminal"
echo ""

# Exécuter le script Python avec redirection de la sortie
python3 train_three_models.py 2>&1 | tee training_output.log

echo ""
echo "✅ Entraînement terminé!"
echo "📄 Les logs complets sont sauvegardés dans: training_output.log"



