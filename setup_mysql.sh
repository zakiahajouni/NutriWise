#!/bin/bash

# Script pour configurer MySQL pour NutriWise
# Exécutez ce script avec: bash setup_mysql.sh

echo "🔧 Configuration de MySQL pour NutriWise..."
echo ""

# Vérifier si MySQL est en cours d'exécution
if ! systemctl is-active --quiet mysql; then
    echo "❌ MySQL n'est pas en cours d'exécution. Démarrez-le avec: sudo systemctl start mysql"
    exit 1
fi

echo "✅ MySQL est en cours d'exécution"
echo ""

# Demander le mot de passe root MySQL
echo "Entrez le mot de passe root MySQL (appuyez sur Entrée si aucun mot de passe):"
read -s ROOT_PASSWORD

# Créer la base de données
echo ""
echo "📦 Création de la base de données 'nutriwise'..."

if [ -z "$ROOT_PASSWORD" ]; then
    mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutriwise;
SOURCE database/schema.sql;
EOF
else
    mysql -u root -p"$ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutriwise;
SOURCE database/schema.sql;
EOF
fi

if [ $? -eq 0 ]; then
    echo "✅ Base de données créée avec succès"
else
    echo "❌ Erreur lors de la création de la base de données"
    echo "💡 Essayez de vous connecter manuellement à MySQL et exécutez:"
    echo "   mysql -u root -p"
    echo "   CREATE DATABASE IF NOT EXISTS nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "   USE nutriwise;"
    echo "   SOURCE database/schema.sql;"
    exit 1
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 Vérifiez que le fichier .env.local contient les bonnes informations:"
echo "   DB_HOST=localhost"
echo "   DB_USER=root"
echo "   DB_PASSWORD=(votre mot de passe root ou vide)"
echo "   DB_NAME=nutriwise"


