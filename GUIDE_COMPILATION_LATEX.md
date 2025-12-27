# Guide de Compilation du Rapport LaTeX

## Option 1 : Utiliser Overleaf (RECOMMANDÉ - Plus Simple) ⭐

Overleaf est un éditeur LaTeX en ligne gratuit qui ne nécessite aucune installation.

### Étapes :

1. **Créer un compte** sur https://www.overleaf.com (gratuit)

2. **Créer un nouveau projet** :
   - Cliquez sur "New Project" → "Upload Project"
   - Téléchargez tous les fichiers `.tex`, `.bib` et les images

3. **Fichiers à télécharger** :
   - `rapport_ml.tex` (fichier principal)
   - `abstract.tex`
   - `Accord_depot.tex`
   - `Biblio.bib`
   - Images : `embleme.jpg`, `logonoir.png` (si disponibles)
   - Images générées : `classification_accuracy.png`, etc. (optionnel)

4. **Compiler** :
   - Overleaf compile automatiquement
   - Cliquez sur "Recompile" si nécessaire
   - Le PDF sera généré automatiquement

### Avantages :
- ✅ Pas d'installation nécessaire
- ✅ Compilation automatique
- ✅ Interface intuitive
- ✅ Collaboration possible
- ✅ Gratuit pour les projets personnels

---

## Option 2 : Installation Locale de LaTeX

### Installation sur Ubuntu/Debian :

```bash
# Installation complète (recommandée mais volumineuse ~3-4 GB)
sudo apt update
sudo apt install -y texlive-full

# OU installation minimale (plus légère)
sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-bibtex-extra
```

### Compilation :

```bash
# 1. Compiler une première fois
pdflatex rapport_ml.tex

# 2. Générer la bibliographie
bibtex rapport_ml

# 3. Recompiler deux fois pour résoudre les références
pdflatex rapport_ml.tex
pdflatex rapport_ml.tex

# Le PDF sera généré : rapport_ml.pdf
```

### Script de compilation automatique :

Créez un fichier `compile.sh` :

```bash
#!/bin/bash
pdflatex rapport_ml.tex
bibtex rapport_ml
pdflatex rapport_ml.tex
pdflatex rapport_ml.tex
echo "Compilation terminée ! Ouvrez rapport_ml.pdf"
```

Puis exécutez :
```bash
chmod +x compile.sh
./compile.sh
```

---

## Option 3 : Utiliser TeXstudio (Éditeur Graphique)

1. **Installer TeXstudio** :
```bash
sudo apt install -y texstudio
```

2. **Ouvrir le projet** :
   - Ouvrir `rapport_ml.tex` dans TeXstudio
   - Cliquer sur "Build & View" (F5)

---

## Images Manquantes

Le rapport référence plusieurs images. Vous avez deux options :

### Option A : Générer les images avec Python

```bash
cd ml_api
source venv/bin/activate
python3 generate_curves.py
```

Les images seront générées dans `images/modeles/`

### Option B : Commenter les références aux images

Dans `rapport_ml.tex`, commentez les lignes `\includegraphics` si les images ne sont pas disponibles :

```latex
% \includegraphics[width=0.8\textwidth]{classification_accuracy.png}
```

---

## Résolution des Erreurs Courantes

### Erreur : "File not found"
- Vérifiez que tous les fichiers sont dans le même dossier
- Vérifiez les chemins des images

### Erreur : "Undefined control sequence"
- Vérifiez que tous les packages sont installés
- Avec Overleaf, tous les packages sont disponibles automatiquement

### Erreur : "Bibliography not found"
- Assurez-vous que `Biblio.bib` est dans le même dossier
- Exécutez `bibtex rapport_ml` avant la dernière compilation

---

## Recommandation Finale

**Utilisez Overleaf** pour éviter tous les problèmes d'installation et de configuration. C'est la solution la plus simple et la plus fiable.

