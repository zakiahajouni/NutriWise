# Guide d'Entraînement des Modèles de Classification

Ce guide explique comment entraîner les trois modèles de classification et voir leur accuracy.

## 📋 Prérequis

1. **Environnement virtuel activé** :
   ```bash
   cd ml_api
   source venv/bin/activate
   ```

2. **Dépendances installées** :
   ```bash
   pip install tensorflow scikit-learn numpy
   ```

## 🚀 Méthode 1 : Script Bash (Recommandé)

Exécutez simplement le script bash :

```bash
cd ml_api
./train_models.sh
```

Ou avec bash explicitement :

```bash
cd ml_api
bash train_models.sh
```

## 🐍 Méthode 2 : Script Python Direct

Si vous préférez exécuter directement le script Python :

```bash
cd ml_api
source venv/bin/activate  # Si l'environnement virtuel n'est pas activé
python3 train_three_models.py
```

## 📊 Les Trois Modèles

Le script entraîne automatiquement trois modèles avec des configurations différentes :

### Modèle 1: Deep and Wide Network
- **Architecture** : [512, 512, 256, 128, 64]
- **Learning Rate** : 0.0005
- **Dropout** : 0.4
- **Caractéristiques** : Réseau large et profond, optimisé pour une haute précision

### Modèle 2: Very Deep Network
- **Architecture** : [1024, 512, 256, 128, 64]
- **Learning Rate** : 0.0003
- **Dropout** : 0.45
- **Caractéristiques** : Réseau très profond avec régularisation importante

### Modèle 3: Balanced Deep Network
- **Architecture** : [768, 384, 192, 96, 48]
- **Learning Rate** : 0.0004
- **Dropout** : 0.4
- **Caractéristiques** : Réseau équilibré entre profondeur et largeur

## 📈 Métriques Affichées

Pour chaque modèle, vous verrez :
- **Accuracy** : Précision globale du modèle (en %)
- **Precision** : Précision des prédictions positives (en %)
- **Recall** : Rappel (couverture) (en %)
- **F1-Score** : Moyenne harmonique de Precision et Recall
- **Loss** : Perte du modèle (plus bas = mieux)

## 🏆 Résultat Final

À la fin de l'entraînement, vous verrez :
1. Un tableau comparatif des trois modèles classés par accuracy
2. Le meilleur modèle identifié
3. L'ID du modèle sauvegardé en base de données

## ⏱️ Temps d'Exécution

L'entraînement peut prendre plusieurs minutes selon :
- La taille du dataset
- La puissance de votre machine
- Le nombre d'epochs (200 par défaut)

**Estimation** : 10-30 minutes pour les trois modèles sur un dataset de 8000 recettes.

## 🔧 Personnalisation

Si vous voulez modifier les configurations, éditez le fichier `train_three_models.py` et modifiez les dictionnaires dans la fonction `main()` :

```python
model_configs = [
    {
        'name': 'Modèle 1: ...',
        'hidden_layers': [512, 512, 256, 128, 64],
        'learning_rate': 0.0005,
        'dropout': 0.4,
        'epochs': 200,  # Modifier ici
        'batch_size': 128  # Modifier ici
    },
    # ...
]
```

## ❓ Dépannage

### Erreur : "ModuleNotFoundError: No module named 'tensorflow'"
**Solution** : Activez l'environnement virtuel et installez les dépendances :
```bash
source venv/bin/activate
pip install tensorflow scikit-learn numpy
```

### Erreur : "Dataset trop petit"
**Solution** : Assurez-vous d'avoir au moins 50 recettes dans votre dataset JSON.

### Erreur : "Out of memory"
**Solution** : Réduisez le `batch_size` dans les configurations (par exemple, de 128 à 64).

## 📝 Notes

- Le meilleur modèle est automatiquement activé dans la base de données
- Chaque modèle est sauvegardé avec un ID unique
- Les métriques sont affichées en temps réel pendant l'entraînement
- Les modèles précédents restent dans la base de données mais ne sont pas activés







