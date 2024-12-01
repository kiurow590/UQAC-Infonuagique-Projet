FROM node:18-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires
COPY package*.json ./
COPY app.js ./

# Installer les dépendances
RUN npm install

# Exécuter l'application
CMD ["node", "serv.js"]
