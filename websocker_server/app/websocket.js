// websocket.js
import WebSocket from 'ws';
import { logger } from '../logger.mjs';

const users = {};

const setupWebSocket = (server, mqttClient, db) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        let userId = null; // Remplacez null par l'ID de l'utilisateur connecté

        ws.on('close', () => {
            logger.info(`Déconnexion de l'utilisateur ${userId}`);
            delete users[userId];
        });

        ws.on('message', async (message) => {
            logger.info(`Message reçu de l'utilisateur ${userId}: ${message}`);
            userId = JSON.parse(message).userId;
            users[userId] = ws;
            try {
                // récupération des abonnement du client via la bdd
                logger.info('Récupération des abonnements du client');
                const [subscriptions] = await db.query(
                    'SELECT t.name FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE s.user_id = ?',
                    [userId]
                );
                for (const sub of subscriptions) {
                    mqttClient.subscribe(sub.name, (err) => {
                        if (err) {
                            logger.error('Erreur lors de l\'abonnement au topic:', err.message);
                        } else {
                            logger.info('Abonné au topic:', sub.name);
                        }
                    });
                }
            } catch (error) {
                logger.error('Erreur lors de l\'abonnement au topic:', error.message);
            }
            });
    });

    mqttClient.on('message', async (topic, message) => {
        logger.info(`Message reçu sur le topic ${topic}: ${message.toString()}`);

        try {
            const [subscriptions] = await db.query(
                'SELECT user_id, topic_id FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE t.name = ?',
                [topic]
            );
            for (const sub of subscriptions) {
                const ws = users[sub.user_id];
                if (ws) {
                    logger.info('Envoi du message à l\'utilisateur', sub.user_id);
                    ws.send(JSON.stringify({
                        topic: topic,
                        message: message.toString(),
                        date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
                    }));
                }
            }

        } catch (error) {
            logger.error('Erreur lors de la récupération des abonnements :', error.message);
        }
    });
};

export default setupWebSocket;