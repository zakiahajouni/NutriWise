#!/usr/bin/env python3
"""
Version sécurisée du script d'entraînement qui redirige complètement la sortie
pour éviter tout blocage
"""

import sys
import os
import subprocess
import time

# DÉSACTIVER TOUS LES LOGS AVANT TOUT
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['KERAS_BACKEND'] = 'tensorflow'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

def main():
    print("="*80)
    print("ENTRAÎNEMENT DES MODÈLES DE CLASSIFICATION")
    print("="*80)
    print("\n📝 Cette version redirige la sortie vers un fichier pour éviter le blocage")
    print("📄 Les résultats seront affichés en temps réel ET sauvegardés dans training.log\n")
    
    log_file = 'training.log'
    
    # Exécuter le script Python avec redirection complète
    script_path = os.path.join(os.path.dirname(__file__), 'train_three_models.py')
    
    print(f"🚀 Démarrage de l'entraînement...")
    print(f"📄 Suivez la progression avec: tail -f {log_file}\n")
    print("-"*80)
    
    # Ouvrir le processus avec redirection
    with open(log_file, 'w') as log:
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Afficher la sortie en temps réel
        for line in process.stdout:
            print(line, end='', flush=True)
            log.write(line)
            log.flush()
        
        process.wait()
    
    print("\n" + "="*80)
    print("✅ Entraînement terminé!")
    print(f"📄 Logs complets disponibles dans: {log_file}")
    print("="*80)

if __name__ == '__main__':
    main()


