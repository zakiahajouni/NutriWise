# Guide d'Installation - NutriWise

## Prérequis

- Node.js 18+ et npm
- MySQL 8.0+
- Un compte MySQL avec les permissions nécessaires

## Étapes d'Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer MySQL

Créez une base de données MySQL et un utilisateur :

```sql
CREATE DATABASE nutriwise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nutriwise_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON nutriwise.* TO 'nutriwise_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.local.example .env.local
```

Éditez `.env.local` avec vos informations :

```env
DB_HOST=localhost
DB_USER=nutriwise_user
DB_PASSWORD=votre_mot_de_passe
DB_NAME=nutriwise

JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire_changez_cela_en_production
NEXTAUTH_URL=http://localhost:3000
```

### 4. Initialiser la base de données

Exécutez le script SQL pour créer les tables :

```bash
mysql -u nutriwise_user -p nutriwise < database/schema.sql
```

Ou connectez-vous à MySQL et exécutez le contenu de `database/schema.sql` :

```bash
mysql -u nutriwise_user -p
USE nutriwise;
SOURCE database/schema.sql;
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Structure du Projet

```
NextML/
├── app/                    # Pages Next.js (App Router)
│   ├── api/               # Routes API
│   ├── dashboard/         # Pages du dashboard
│   ├── login/             # Page de connexion
│   ├── register/          # Page d'inscription
│   └── page.tsx           # Page d'accueil
├── components/            # Composants React réutilisables
├── lib/                   # Utilitaires (DB, auth)
├── database/              # Scripts SQL
└── public/                # Assets statiques
```

## Fonctionnalités

✅ Page d'accueil vitrine professionnelle
✅ Authentification (Login/Register)
✅ Formulaire d'inscription multi-étapes
✅ Dashboard utilisateur
✅ Gestion des recettes (CRUD)
✅ Modification du profil
✅ Connexion MySQL
✅ Interface moderne et responsive

## Prochaines Étapes

- Intégration ML pour les suggestions de recettes
- Système de planification de repas
- Génération automatique de recettes basée sur les préférences

