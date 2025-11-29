# Guide de Mise à Jour de Node.js

Votre version actuelle de Node.js (12.22.12) est trop ancienne pour Next.js 14.
Vous devez installer Node.js 18 ou supérieur.

## Option 1 : Utiliser NVM (Recommandé)

### Installer NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

Puis redémarrez votre terminal ou exécutez :
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Installer Node.js 18
```bash
nvm install 18
nvm use 18
nvm alias default 18
```

### Vérifier l'installation
```bash
node --version  # Devrait afficher v18.x.x ou supérieur
npm --version
```

## Option 2 : Installer Node.js via le gestionnaire de paquets

### Sur Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Vérifier l'installation
```bash
node --version
npm --version
```

## Après la mise à jour

Une fois Node.js mis à jour, retournez dans le dossier du projet et installez les dépendances :

```bash
cd /home/user/Bureau/NextML
npm install
npm run dev
```

