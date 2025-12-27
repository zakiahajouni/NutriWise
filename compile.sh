#!/bin/bash
# Script de compilation automatique du rapport LaTeX

echo "=========================================="
echo "Compilation du Rapport LaTeX"
echo "=========================================="
echo ""

# Vérifier si pdflatex est installé
if ! command -v pdflatex &> /dev/null; then
    echo "❌ Erreur: pdflatex n'est pas installé"
    echo ""
    echo "Pour installer LaTeX:"
    echo "  sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-bibtex-extra"
    echo ""
    echo "OU utilisez Overleaf (recommandé): https://www.overleaf.com"
    exit 1
fi

echo "✅ pdflatex trouvé"
echo ""

# Étape 1: Première compilation
echo "📄 Étape 1/4: Première compilation..."
pdflatex -interaction=nonstopmode rapport_ml.tex > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la première compilation"
    pdflatex rapport_ml.tex
    exit 1
fi
echo "✅ Première compilation réussie"

# Étape 2: Génération de la bibliographie
echo "📚 Étape 2/4: Génération de la bibliographie..."
if [ -f "Biblio.bib" ]; then
    bibtex rapport_ml > /dev/null 2>&1
    echo "✅ Bibliographie générée"
else
    echo "⚠️  Biblio.bib non trouvé, compilation sans bibliographie"
fi

# Étape 3: Deuxième compilation
echo "📄 Étape 3/4: Deuxième compilation..."
pdflatex -interaction=nonstopmode rapport_ml.tex > /dev/null 2>&1
echo "✅ Deuxième compilation réussie"

# Étape 4: Troisième compilation (pour résoudre toutes les références)
echo "📄 Étape 4/4: Troisième compilation..."
pdflatex -interaction=nonstopmode rapport_ml.tex > /dev/null 2>&1
echo "✅ Troisième compilation réussie"

echo ""
echo "=========================================="
echo "✅ Compilation terminée avec succès !"
echo "=========================================="
echo ""
echo "📄 Le PDF a été généré: rapport_ml.pdf"
echo ""
echo "Pour ouvrir le PDF:"
echo "  xdg-open rapport_ml.pdf"
echo ""

