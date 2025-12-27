#!/bin/bash
# Script pour entraîner les modèles en arrière-plan (solution définitive au blocage)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Activer l'environnement virtuel
if [ -d "venv" ]; then
    source venv/bin/activate
fi

LOG_FILE="training_$(date +%Y%m%d_%H%M%S).log"

echo "="*80
echo "ENTRAÎNEMENT DES MODÈLES EN ARRIÈRE-PLAN"
echo "="*80
echo ""
echo "📝 Le script s'exécute en arrière-plan pour éviter tout blocage"
echo "📄 Suivez la progression avec: tail -f $LOG_FILE"
echo "🛑 Pour arrêter: pkill -f train_three_models.py"
echo ""

# Exécuter la version finale avec processus séparés
nohup python3 train_three_models_final.py > "$LOG_FILE" 2>&1 &
PID=$!

echo "✅ Processus démarré (PID: $PID)"
echo "📄 Logs: $LOG_FILE"
echo ""
echo "Pour suivre en temps réel:"
echo "  tail -f $LOG_FILE"
echo ""
echo "Pour vérifier si c'est toujours en cours:"
echo "  ps aux | grep $PID"
echo ""

# Attendre un peu et afficher les premières lignes
sleep 2
if [ -f "$LOG_FILE" ]; then
    echo "Premières lignes du log:"
    echo "---"
    head -20 "$LOG_FILE"
    echo "---"
    echo ""
    echo "Continuez à suivre avec: tail -f $LOG_FILE"
fi


