#!/bin/bash

# Script d'initialisation du système ML
# Crée les tables et charge le dataset initial

echo "🚀 Initialisation du système ML pour NutriWise..."

# Vérifier que MySQL est accessible
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé ou non accessible"
    exit 1
fi

# Demander les informations de connexion MySQL
read -p "Nom d'utilisateur MySQL [nutriwise]: " DB_USER
DB_USER=${DB_USER:-nutriwise}

read -sp "Mot de passe MySQL: " DB_PASSWORD
echo ""

read -p "Nom de la base de données [nutriwise]: " DB_NAME
DB_NAME=${DB_NAME:-nutriwise}

# Créer les tables ML
echo "📊 Création des tables ML..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < database/ml_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables ML créées avec succès"
else
    echo "❌ Erreur lors de la création des tables"
    exit 1
fi

# Vérifier le nombre de recettes
RECIPE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM recipe_templates" 2>/dev/null)

if [ -n "$RECIPE_COUNT" ]; then
    echo "✅ Dataset initialisé avec $RECIPE_COUNT recettes"
else
    echo "⚠️  Impossible de compter les recettes"
fi

echo ""
echo "🎉 Initialisation terminée !"
echo ""
echo "Prochaines étapes :"
echo "1. Entraînez le modèle : POST /api/ml/train"
echo "2. Générez des recettes : POST /api/ml/generate-meal"
echo ""
echo "Voir ML_SYSTEM.md pour plus d'informations"

