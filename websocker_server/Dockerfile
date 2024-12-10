FROM node:18-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires
COPY package*.json ./

# Installer les dépendances
RUN npm install

COPY server.js ./
COPY logger.mjs ./
COPY app/ ./app/

# Expose API port
EXPOSE 3333

# Exécuter l'application
CMD ["node", "server.js"]
