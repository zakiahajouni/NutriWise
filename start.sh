#!/bin/bash

# Script de démarrage pour NutriWise
# Charge NVM et lance le serveur de développement

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Forcer l'utilisation de Node.js 18
echo "📦 Utilisation de Node.js 18..."
nvm use 18 > /dev/null 2>&1

# Vérifier la version
node_version=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$node_version" ] || [ "$node_version" -lt 18 ]; then
    echo "❌ Erreur: Node.js 18+ requis. Version actuelle: $(node --version 2>/dev/null || echo 'non trouvée')"
    echo "💡 Installez Node.js 18 avec: nvm install 18"
    exit 1
fi

echo "✅ Node.js $(node --version) détecté"
echo "🚀 Démarrage de NutriWise..."
npm run dev

