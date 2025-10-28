# Proxy Backend Sécurisé pour Webhooks

Ce dépôt est un modèle (template) pour un micro-service Node.js sécurisé. Son objectif principal est d'agir comme un "proxy" (un intermédiaire) entre un site web public (frontend) et un service de webhook (comme n8n, Zapier, etc.).

Il résout un problème de sécurité majeur : il empêche des utilisateurs malveillants d'appeler directement votre webhook en cachant vos clés API et en s'assurant que seules les requêtes légitimes de votre site sont autorisées.

## 🚀 Fonctionnalités (Les "Boucliers")

* **🛡️ Authentification JWT** : Protège votre webhook n8n. Le proxy génère un token JWT (JSON Web Token) à courte durée de vie pour chaque requête, prouvant son identité à n8n.
* **🚦 Limitation de Débit (Rate Limiting)** : Bloque les attaques par force brute ou les bots en limitant le nombre de requêtes par adresse IP (configuré à 5 requêtes toutes les 10 minutes).
* **🧱 Contrôle d'Origine (CORS)** : N'accepte que les requêtes provenant de l'URL de votre site web frontend.
* **🐳 Prêt pour Coolify** : Comprend un `docker-compose.yml` et un `Dockerfile` optimisés pour un déploiement "zéro-clic" sur Coolify (ou tout autre service Docker).
* **❤️ Contrôle de Santé (Health Check)** : Inclut une route `/healthz` pour que Coolify sache que l'application est démarrée et saine.

## 🛠️ Technologies Utilisées

* **Serveur** : Node.js
* **Framework** : Fastify (ultra-rapide et léger)
* **Authentification** : `jose` (pour la génération des JWT)
* **Sécurité** : `@fastify/cors` et `@fastify/rate-limit`
* **Déploiement** : Docker / Docker Compose

---

## 📋 Guide de Déploiement Rapide (Modèle)

Ce guide suppose que vous avez un projet sur Coolify.

### Étape 1 : Configurer n8n

1.  Dans votre workflow n8n, sur le nœud Webhook, choisissez **Authentication: `JWT`**.
2.  Créez un nouvel identifiant (Credential).
3.  **Key Type** : `Passphrase`
4.  **Secret** : Générez un secret long et sécurisé (voir Étape 2). **N'utilisez pas** de caractères spéciaux comme `$`, `"`, `'`, `\`, `` ` ``.
5.  **Algorithm** : `HS256`
6.  **Ne pas** ajouter d'"Issuer" ou d'"Audience".

### Étape 2 : Configurer le Projet Coolify

1.  Clonez ce dépôt pour votre nouveau projet (ex: `mon-super-proxy`).
2.  Dans votre projet Coolify, allez dans l'onglet **"Environment Variables"** (au niveau du **Projet**).
3.  Ajoutez les 3 variables d'environnement suivantes :

    | Nom (Name) | Description | Exemple de Valeur |
    | :--- | :--- | :--- |
    | `N8N_WEBHOOK_URL` | L'URL complète de votre webhook n8n. | `https://n8n.mon-domaine.com/webhook/...` |
    | `N8N_JWT_SECRET` | Le secret (Passphrase) **identique** à celui de l'Étape 1. | `votre_secret_long_et_securise_de_32_caracteres` |
    | `FRONTEND_URL` | L'URL racine de votre site frontend (**SANS** `/` à la fin). | `https://mon-site-web.com` |

### Étape 3 : Déployer le Service

1.  Dans votre projet Coolify, cliquez sur **"Add Resource"** (Ajouter une ressource).
2.  Choisissez **"Docker Compose"**.
3.  Pointez-le vers votre nouveau dépôt Git.
4.  Cliquez sur **"Deploy"**.

Coolify va lire le `docker-compose.yml`, construire l'image, et démarrer le service en injectant vos variables d'environnement.

### Étape 4 : Configurer le Frontend (Votre SPA)

1.  Dans votre projet **Frontend** (votre SPA), ajoutez une variable d'environnement :
    * `VITE_PROXY_URL` = `https://<votre_url_de_proxy>/api/send`

2.  Votre fonction d'envoi (ex: `sendToWebhook.ts`) doit maintenant appeler cette `VITE_PROXY_URL` sans aucune clé API ni en-tête d'authentification.

---

## 📂 Structure des Fichiers

* **`index.js`** : Le cœur de l'application. C'est le serveur Fastify qui contient toute la logique de sécurité.
* **`docker-compose.yml`** : Le "plan de déploiement" pour Coolify. Il définit comment démarrer le service et gère l'injection des variables d'environnement.
* **`Dockerfile`** : Le "plan de construction". Il crée l'image Docker en installant Node.js, `curl` (pour le health check), et les dépendances `npm`.
* **`package.json`** : La liste des dépendances Node.js.
* **`.env.example`** : La "liste de courses" des variables d'environnement requises. (Pour référence uniquement).
* **`.dockerignore`** : Optimise le build en ignorant les fichiers inutiles (`node_modules`, `.git`, etc.).
