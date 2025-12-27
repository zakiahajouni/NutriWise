# 🚨 GUIDE IMPORTANT - Éviter le Blocage

## ⚠️ PROBLÈME CONNU

L'entraînement des modèles TensorFlow/Keras **bloque le processus** car il utilise intensivement le CPU. Même depuis le terminal, le processus peut sembler "bloqué" (mais c'est normal, il travaille).

## ✅ SOLUTION DÉFINITIVE : Exécuter en ARRIÈRE-PLAN

**La meilleure solution est d'exécuter le script en arrière-plan** pour que le terminal reste utilisable.

### 🏆 Méthode RECOMMANDÉE : Script en arrière-plan

```bash
cd /home/user/Bureau/NextML/ml_api
source venv/bin/activate
./train_models_background.sh
```

Ce script :
- ✅ Lance l'entraînement en arrière-plan
- ✅ Redirige tous les logs vers un fichier
- ✅ Laisse le terminal libre pour d'autres commandes
- ✅ Vous permet de suivre la progression avec `tail -f`

### Méthode Alternative 1 : Manuel en arrière-plan

```bash
cd /home/user/Bureau/NextML/ml_api
source venv/bin/activate
nohup python3 train_three_models.py > training_output.log 2>&1 &
```

Puis suivez la progression avec :
```bash
tail -f training_output.log
```

### Méthode Alternative 2 : Dans un terminal séparé (tmux/screen)

```bash
# Terminal 1: Lancer tmux
tmux new -s training

# Dans tmux:
cd /home/user/Bureau/NextML/ml_api
source venv/bin/activate
python3 train_three_models.py

# Détacher: Ctrl+B puis D
# Réattacher: tmux attach -t training
```

## 📊 Résultats

Les résultats seront affichés dans le terminal et vous verrez :
- L'accuracy toutes les 10 epochs
- Les métriques finales pour chaque modèle
- Un tableau comparatif des trois modèles

## 📊 Suivre la Progression

Une fois l'entraînement lancé en arrière-plan :

```bash
# Voir les dernières lignes du log
tail -f training_*.log

# Ou pour un fichier spécifique
tail -f training_20241226_123456.log
```

## 🛑 Arrêter l'Entraînement

Si vous devez arrêter l'entraînement :

```bash
# Trouver le processus
ps aux | grep train_three_models.py

# Arrêter le processus (remplacez PID par le numéro du processus)
kill PID

# Ou forcer l'arrêt
kill -9 PID
```

## 💡 Pourquoi ça semble "bloqué" ?

TensorFlow/Keras utilise **intensivement le CPU** pendant l'entraînement. C'est **NORMAL** que :
- Le processus semble "bloqué" (il travaille activement)
- Le CPU soit à 100%
- Le terminal ne réponde pas immédiatement

**C'est pourquoi on exécute en arrière-plan** - le processus travaille sans bloquer votre terminal.

## ✅ Vérifier que ça fonctionne

Pendant l'entraînement, vous devriez voir dans le log :
- `Epoch 10/200 - Train Acc: XX.XX% | Val Acc: XX.XX%`
- `Epoch 20/200 - Train Acc: XX.XX% | Val Acc: XX.XX%`
- etc.

Si vous ne voyez rien pendant plusieurs minutes, vérifiez avec `ps aux | grep python` que le processus tourne toujours.


