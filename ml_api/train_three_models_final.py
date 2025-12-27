#!/usr/bin/env python3
"""
Version finale qui utilise des processus complètement séparés
pour éviter TOUT blocage
"""

import sys
import os
import json
import subprocess
import time

# DÉSACTIVER TOUS LES LOGS
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

def main():
    print("="*80)
    print("ENTRAÎNEMENT DES TROIS MODÈLES DE CLASSIFICATION")
    print("="*80)
    print("\n📝 Cette version utilise des processus séparés pour éviter le blocage")
    print("⏳ Chaque modèle sera entraîné dans un processus isolé\n")
    
    # Configurations
    model_configs = [
        {
            'name': 'Modèle 1: Deep and Wide Network',
            'hidden_layers': [512, 512, 256, 128, 64],
            'learning_rate': 0.0005,
            'dropout': 0.4,
            'epochs': 200,
            'batch_size': 128
        },
        {
            'name': 'Modèle 2: Very Deep Network',
            'hidden_layers': [1024, 512, 256, 128, 64],
            'learning_rate': 0.0003,
            'dropout': 0.45,
            'epochs': 200,
            'batch_size': 128
        },
        {
            'name': 'Modèle 3: Balanced Deep Network',
            'hidden_layers': [768, 384, 192, 96, 48],
            'learning_rate': 0.0004,
            'dropout': 0.4,
            'epochs': 200,
            'batch_size': 128
        }
    ]
    
    log_file = 'training_results.log'
    script_dir = os.path.dirname(os.path.abspath(__file__))
    worker_script = os.path.join(script_dir, 'train_models_worker.py')
    
    # Nettoyer le fichier de log
    with open(log_file, 'w') as f:
        f.write("Résultats d'entraînement\n")
        f.write("="*80 + "\n\n")
    
    results = []
    
    # Entraîner chaque modèle dans un processus séparé
    for i, config in enumerate(model_configs, 1):
        print(f"\n🚀 Lancement du Modèle {i} dans un processus séparé...")
        sys.stdout.flush()
        
        config_json = json.dumps(config)
        
        # Lancer le worker dans un processus complètement séparé
        process = subprocess.Popen(
            [sys.executable, worker_script, config_json, str(i), log_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=script_dir
        )
        
        # Attendre la fin (sans bloquer l'affichage)
        print(f"   ⏳ Entraînement du Modèle {i} en cours... (PID: {process.pid})")
        print(f"   📄 Suivez la progression: tail -f {log_file}")
        sys.stdout.flush()
        
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            try:
                result = json.loads(stdout.decode())
                if result.get('success'):
                    results.append(result)
                    print(f"   ✅ Modèle {i} terminé avec succès!")
                    print(f"      Accuracy: {result['metrics']['accuracy']*100:.2f}%")
                else:
                    print(f"   ❌ Modèle {i} a échoué: {result.get('error', 'Unknown error')}")
            except:
                print(f"   ⚠️  Modèle {i} terminé (vérifiez {log_file} pour les détails)")
        else:
            print(f"   ❌ Erreur lors de l'entraînement du Modèle {i}")
            if stderr:
                print(f"      Erreur: {stderr.decode()[:200]}")
        
        sys.stdout.flush()
    
    # Afficher le résumé
    print("\n" + "="*80)
    print("RÉSUMÉ DES RÉSULTATS")
    print("="*80)
    
    if results:
        results.sort(key=lambda x: x['metrics']['accuracy'], reverse=True)
        
        print("\n🏆 Classement par Accuracy:")
        print("┌─────┬──────────────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐")
        print("│ #   │ Modèle                               │ Accuracy │ Precision│ Recall   │ F1-Score │ Loss     │")
        print("├─────┼──────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤")
        
        for i, result in enumerate(results, 1):
            m = result['metrics']
            name = result['name'].replace('Modèle ', 'M').split(':')[0]
            print(f"│ {i}   │ {name:<36} │ {m['accuracy']*100:>7.2f}% │ {m['precision']*100:>7.2f}% │ {m['recall']*100:>7.2f}% │ {m['f1Score']:>8.4f} │ {m['loss']:>8.4f} │")
        
        print("└─────┴──────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘")
        
        if results:
            best = results[0]
            print(f"\n🥇 Meilleur modèle: {best['name']}")
            print(f"   Model ID: {best['model_id']}")
            print(f"   Accuracy: {best['metrics']['accuracy']*100:.2f}%")
    else:
        print("\n❌ Aucun modèle n'a pu être entraîné avec succès.")
        print(f"   Vérifiez {log_file} pour les détails des erreurs.")
    
    print(f"\n📄 Logs complets disponibles dans: {log_file}")
    print("="*80)

if __name__ == '__main__':
    main()

