# Étape 1 : Utiliser une image Node.js officielle et légère
FROM node:20-alpine

# Étape 2 : Définir le dossier de travail dans le conteneur
WORKDIR /usr/src/app

# Étape 3 : Copier le plan et installer les briques
COPY package*.json ./
RUN apk add --no-cache curl && npm install

# Étape 4 : Copier le code de notre application
COPY . .

# Étape 5 : La commande pour démarrer le serveur
CMD [ "npm", "start" ]
