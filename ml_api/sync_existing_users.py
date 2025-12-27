"""
Script pour synchroniser les utilisateurs existants de MySQL vers le fichier JSON
Utile pour migrer les utilisateurs déjà créés
"""

import mysql.connector
import json
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

def sync_users_from_mysql():
    """Synchronise les utilisateurs depuis MySQL vers le fichier JSON"""
    try:
        # Connexion MySQL
        mysql_conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'nutriwise'),
            password=os.getenv('DB_PASSWORD', 'nutriwise123'),
            database=os.getenv('DB_NAME', 'nutriwise'),
            port=int(os.getenv('DB_PORT', 3306))
        )
        
        cursor = mysql_conn.cursor(dictionary=True)
        
        # Charger les utilisateurs et leurs profils
        cursor.execute("""
            SELECT 
                u.id as user_id,
                u.email,
                up.age,
                up.gender,
                up.activity_level,
                up.dietary_preference,
                up.allergies,
                up.health_conditions
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            ORDER BY u.id
        """)
        
        mysql_users = cursor.fetchall()
        cursor.close()
        mysql_conn.close()
        
        # Charger le fichier JSON actuel
        data_path = Path(__file__).parent / 'data.json'
        if data_path.exists():
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {
                "recipes": [],
                "user_profiles": [],
                "interactions": [],
                "ml_models": []
            }
        
        # Convertir les utilisateurs MySQL au format JSON
        user_profiles = []
        for user in mysql_users:
            # Parser les allergies et health_conditions si ce sont des strings JSON
            allergies = user.get('allergies', [])
            if isinstance(allergies, str):
                try:
                    allergies = json.loads(allergies)
                except:
                    allergies = []
            
            health_conditions = user.get('health_conditions', [])
            if isinstance(health_conditions, str):
                try:
                    health_conditions = json.loads(health_conditions)
                except:
                    health_conditions = []
            
            profile = {
                'user_id': user['user_id'],
                'email': user['email'],
                'age': user.get('age'),
                'gender': user.get('gender'),
                'activity_level': user.get('activity_level'),
                'dietary_preference': user.get('dietary_preference'),
                'allergies': allergies,
                'health_conditions': health_conditions
            }
            user_profiles.append(profile)
        
        # Mettre à jour le fichier JSON
        data['user_profiles'] = user_profiles
        
        # Sauvegarder
        with open(data_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ {len(user_profiles)} utilisateurs synchronisés depuis MySQL vers {data_path}")
        
    except mysql.connector.Error as e:
        print(f"❌ Erreur MySQL: {e}")
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == '__main__':
    sync_users_from_mysql()


