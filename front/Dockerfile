# Étape 1 : Utiliser une image Node pour la construction
FROM node:18-alpine AS build-stage

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code de l'application
COPY . .

# Construire l'application pour la production
RUN npm run build

# Étape 2 : Utiliser une image Nginx pour servir l'application
FROM nginx:stable-alpine AS production-stage

# Copier les fichiers générés dans le dossier `dist` vers le dossier nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copier un fichier de configuration Nginx personnalisé (facultatif)
# COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port 80
EXPOSE 80

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
