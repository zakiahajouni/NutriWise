# Configuration MySQL sur Render - Guide Complet

## 🔴 Problème : ECONNREFUSED

L'erreur `ECONNREFUSED` signifie que votre application ne peut pas se connecter à MySQL. Voici comment résoudre ce problème.

## ✅ Solution Étape par Étape

### Étape 1 : Créer une Base de Données MySQL sur Render

1. Allez sur votre dashboard Render : https://dashboard.render.com
2. Cliquez sur **"New +"** → **"PostgreSQL"** ou cherchez **"MySQL"**
3. Si MySQL n'est pas disponible directement, cherchez dans les services disponibles
4. Créez une nouvelle base de données MySQL
5. **Notez les informations de connexion** affichées

### Étape 2 : Obtenir les Informations de Connexion

Render vous donnera soit :
- Une **URL de connexion** complète : `mysql://user:password@hostname:3306/dbname`
- Ou des **informations séparées** :
  - Host
  - Port
  - Database
  - User
  - Password

### Étape 3 : Configurer les Variables d'Environnement

Dans votre service Web Next.js sur Render :

1. Allez dans **"Environment"** (dans les paramètres de votre service)
2. Ajoutez ces variables :

#### Option A : Si Render fournit une URL complète

```
DATABASE_URL=mysql://user:password@hostname:3306/dbname
RENDER=true
DB_SSL=true
```

#### Option B : Si vous avez les informations séparées

```
DB_HOST=votre-host-mysql.render.com
DB_USER=votre-utilisateur
DB_PASSWORD=votre-mot-de-passe
DB_NAME=nutriwise
DB_PORT=3306
DB_SSL=true
RENDER=true
```

### Étape 4 : Important - Variables Requises

**TOUTES ces variables doivent être définies :**

- ✅ `DB_HOST` ou `DATABASE_URL`
- ✅ `DB_USER` (si pas d'URL)
- ✅ `DB_PASSWORD` (si pas d'URL)
- ✅ `DB_NAME` (si pas d'URL)
- ✅ `DB_SSL=true` (OBLIGATOIRE pour Render)
- ✅ `RENDER=true` (pour activer le mode Render)

### Étape 5 : Initialiser la Base de Données

Après avoir configuré les variables, vous devez créer les tables :

1. **Via le Dashboard Render** :
   - Allez dans votre base de données MySQL
   - Cliquez sur "Connect" ou "Query"
   - Exécutez le contenu de `database/schema.sql`

2. **Via un script d'initialisation** :
   Créez une route API temporaire pour initialiser :

```typescript
// app/api/init-db/route.ts (TEMPORAIRE - à supprimer après)
import db from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    // Exécuter le schéma
    await db.query(schema)
    
    return Response.json({ success: true, message: 'Database initialized!' })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
```

Puis visitez : `https://votre-app.onrender.com/api/init-db`

**⚠️ Supprimez cette route après l'initialisation pour des raisons de sécurité !**

### Étape 6 : Redéployer

1. Après avoir configuré les variables d'environnement
2. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**
3. Attendez que le déploiement se termine
4. Vérifiez les logs pour voir si la connexion fonctionne

## 🔍 Vérification

### Vérifier que les Variables sont Définies

Les logs au démarrage devraient afficher :
```
✅ Connexion à la base de données MySQL réussie
```

Si vous voyez :
```
❌ Erreur de connexion à la base de données: ECONNREFUSED
```

Cela signifie que les variables ne sont pas correctement configurées.

### Test de Connexion

Créez une route de test :

```typescript
// app/api/test-db/route.ts
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [result] = await db.execute('SELECT 1 as test') as any[]
    return Response.json({ 
      success: true, 
      message: 'Database connected!',
      result 
    })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      env: {
        hasHost: !!process.env.DB_HOST,
        hasUser: !!process.env.DB_USER,
        hasPassword: !!process.env.DB_PASSWORD,
        hasDatabase: !!process.env.DB_NAME,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        render: process.env.RENDER
      }
    }, { status: 500 })
  }
}
```

Visitez : `https://votre-app.onrender.com/api/test-db`

## ⚠️ Erreurs Courantes

### 1. "ECONNREFUSED"
- **Cause** : Variables d'environnement manquantes ou incorrectes
- **Solution** : Vérifiez toutes les variables dans Render → Environment

### 2. "Access denied"
- **Cause** : Mauvais mot de passe ou utilisateur
- **Solution** : Vérifiez les credentials dans Render

### 3. "Unknown database"
- **Cause** : La base de données n'existe pas
- **Solution** : Créez la base de données ou utilisez le bon nom dans `DB_NAME`

### 4. "SSL required"
- **Cause** : SSL non activé
- **Solution** : Ajoutez `DB_SSL=true` dans les variables d'environnement

## 📝 Checklist de Configuration

- [ ] Base de données MySQL créée sur Render
- [ ] Variables d'environnement configurées dans le service Web
- [ ] `DB_SSL=true` défini
- [ ] `RENDER=true` défini
- [ ] Schéma de base de données exécuté
- [ ] Service redéployé
- [ ] Logs vérifiés (pas d'erreur ECONNREFUSED)
- [ ] Test de connexion réussi (`/api/test-db`)

## 🆘 Support

Si le problème persiste :
1. Vérifiez les logs complets sur Render
2. Vérifiez que la base de données MySQL est dans la même région que votre service Web
3. Contactez le support Render si nécessaire

