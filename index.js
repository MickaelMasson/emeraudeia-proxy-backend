import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import * as jose from 'jose';

// --- CONFIGURATION ---
// Ces valeurs viendront de vos "Secrets" sur Coolify
const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const JWT_SECRET_STRING = process.env.N8N_JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PORT = process.env.PORT || 3000; // <-- CHANGEMENT 1: Port depuis l'environnement

// Vérification critique au démarrage
if (!WEBHOOK_URL || !JWT_SECRET_STRING || !FRONTEND_URL) {
  console.error("Erreur: N8N_WEBHOOK_URL, N8N_JWT_SECRET ou FRONTEND_URL n'est pas défini !");
  process.exit(1); // Arrête le serveur si la config est manquante
}

// Préparation de la clé secrète
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const alg = 'HS256';
// --- FIN CONFIGURATION ---


// 1. Initialiser le serveur
const fastify = Fastify({ logger: true });

// 2. Installer le "videur" (CORS)
// Il n'acceptera que les requêtes venant de votre site (FRONTEND_URL)
fastify.register(cors, {
  origin: FRONTEND_URL, 
});

// 3. Installer le "limiteur de vitesse"
// Max 5 requêtes toutes les 10 minutes par IP
fastify.register(rateLimit, {
  max: 5,
  timeWindow: '10 minutes',
});

// 4. NOUVEAU: Route pour le "Health Check"
// Coolify (via docker-compose) l'utilisera pour savoir si le serveur est prêt
fastify.get('/healthz', async (request, reply) => {
  try {
    return reply.status(200).send({ status: 'ok' });
  } catch (error) {
    // Cette route ne devrait jamais échouer, mais c'est une bonne pratique
    fastify.log.error(error, 'Erreur Health Check');
    return reply.status(500).send({ status: 'error' });
  }
});

// 5. Créer le point de terminaison (l'URL de notre API)
fastify.post('/api/send', async (request, reply) => {
  try {
    // 6. Récupérer les données du formulaire envoyées par la SPA
    const payloadFromBrowser = request.body;

    // 7. Générer le token JWT sécurisé (valide 2 minutes)
    const token = await new jose.SignJWT({})
      .setProtectedHeader({ alg })
      .setExpirationTime('2m')
      .setIssuedAt()
      .sign(JWT_SECRET);

    // 8. Appeler n8n avec le token
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // On utilise le JWT ici
      },
      body: JSON.stringify(payloadFromBrowser),
    });

    if (!response.ok) {
      // Si n8n n'est pas content, on le dit au frontend
      return reply.status(response.status).send({ error: "Erreur de n8n" });
    }

    // 9. Tout s'est bien passé !
    return reply.status(200).send({ success: true });

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Erreur interne du serveur" });
  }
});

// 10. Démarrer le serveur (important pour Coolify)
fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => { // <-- CHANGEMENT 2: Utilise la variable PORT
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Serveur proxy démarré sur ${address}`);
});
