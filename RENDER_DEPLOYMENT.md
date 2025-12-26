# Guide de Déploiement sur Render.com

Ce guide explique comment déployer NutriWise sur Render.com et configurer correctement la base de données MySQL.

## Variables d'Environnement Requises

Sur Render.com, vous devez configurer les variables d'environnement suivantes dans les paramètres de votre service :

### Variables de Base de Données MySQL

```
DB_HOST=votre-host-mysql.render.com
DB_USER=votre-utilisateur-mysql
DB_PASSWORD=votre-mot-de-passe-mysql
DB_NAME=nutriwise
DB_PORT=3306
DB_SSL=true
```

### Comment obtenir ces valeurs sur Render.com

1. **Créez une base de données MySQL** sur Render.com :
   - Allez dans votre dashboard Render
   - Cliquez sur "New +" → "PostgreSQL" ou "MySQL"
   - Choisissez MySQL
   - Notez les informations de connexion affichées

2. **Configurez les variables d'environnement** :
   - Dans votre service Web (Next.js), allez dans "Environment"
   - Ajoutez toutes les variables listées ci-dessus
   - Utilisez les valeurs de votre base de données MySQL créée

### Exemple de Configuration

Si Render vous donne une chaîne de connexion comme :
```
mysql://user:password@hostname:3306/dbname
```

Vous devez extraire :
- `DB_HOST` = hostname
- `DB_USER` = user
- `DB_PASSWORD` = password
- `DB_NAME` = dbname
- `DB_PORT` = 3306 (généralement)
- `DB_SSL` = true (pour les connexions sécurisées sur Render)

## Configuration du Build

Le build command sur Render doit être :
```bash
npm install && npm run build
```

Le start command doit être :
```bash
npm start
```

## Initialisation de la Base de Données

Après le déploiement, vous devez initialiser la base de données :

1. **Connectez-vous à votre base de données MySQL** via le dashboard Render
2. **Exécutez les scripts SQL** dans l'ordre :
   - `database/schema.sql` (schéma principal)
   - `database/ml_schema.sql` (schéma ML si nécessaire)

Ou utilisez le script d'initialisation :
```bash
# Via SSH sur Render (si disponible)
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < database/schema.sql
```

## Résolution des Problèmes

### Erreur ECONNREFUSED

Si vous voyez `ECONNREFUSED`, cela signifie que :
1. Les variables d'environnement ne sont pas correctement configurées
2. La base de données MySQL n'est pas accessible depuis votre service Web
3. Le firewall bloque la connexion

**Solutions :**
- Vérifiez que toutes les variables d'environnement sont définies
- Assurez-vous que la base de données MySQL est dans la même région que votre service Web
- Vérifiez que le port 3306 est ouvert
- Activez SSL si nécessaire (`DB_SSL=true`)

### Erreur "Dynamic server usage"

Les routes API sont maintenant configurées avec `export const dynamic = 'force-dynamic'` pour éviter cette erreur pendant le build.

### Vérification de la Connexion

Pour tester la connexion à la base de données, vous pouvez créer une route de test temporaire :

```typescript
// app/api/test-db/route.ts
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [result] = await db.execute('SELECT 1 as test') as any[]
    return Response.json({ success: true, message: 'Database connected!' })
  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message,
      code: error.code 
    }, { status: 500 })
  }
}
```

## Notes Importantes

- Les routes API sont maintenant marquées comme dynamiques pour éviter les erreurs de rendu statique
- La gestion des erreurs de connexion a été améliorée pour donner des messages plus clairs
- Le pool de connexions MySQL est configuré avec des timeouts appropriés pour Render

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de déploiement sur Render
2. Vérifiez les logs de runtime dans le dashboard Render
3. Assurez-vous que toutes les variables d'environnement sont correctement configurées

