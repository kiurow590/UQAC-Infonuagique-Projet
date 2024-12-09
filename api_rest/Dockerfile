FROM node:18-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires
COPY package*.json ./

# Installer les dépendances
RUN npm install

COPY . .

# Expose API port
EXPOSE 3000

# Exécuter l'application
CMD ["node", "server.js"]
