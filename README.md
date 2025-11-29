# NutriWise - Application Intelligente de Planification de Repas

NutriWise est une application Next.js moderne pour planifier les repas et proposer des suggestions personnalisées basées sur les préférences de l'utilisateur.

## Fonctionnalités

- 🏠 Page d'accueil vitrine professionnelle
- 🔐 Authentification (Login/Register)
- 📝 Formulaire d'inscription multi-étapes
- 👤 Dashboard utilisateur
- 📊 Historique des recettes
- ✨ Interface moderne et responsive

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp .env.local.example .env.local
# Éditer .env.local avec vos informations MySQL
```

3. Créer la base de données MySQL :
```bash
# Se connecter à MySQL et exécuter le script dans database/schema.sql
```

4. Lancer le serveur de développement :
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure du Projet

- `/app` - Pages et routes Next.js 14 (App Router)
- `/components` - Composants React réutilisables
- `/lib` - Utilitaires et configuration (MySQL, auth)
- `/database` - Scripts SQL et schéma de base de données
- `/public` - Assets statiques (images, etc.)

