#!/bin/bash
# Script simple pour entraîner le modèle de classification

cd "$(dirname "$0")"

# Activer l'environnement virtuel si disponible
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Exécuter le script d'entraînement simple
python3 train_simple.py



