import express from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger.mjs';

const router = express.Router();

export default (db) => {

    /**
     * ROUTES DE L'API POUR L'INSCRIPTION ET LA CONNEXION DES UTILISATEURS
     */
    router.post('/users/signup', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();
            await db.query('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [userId, email, hashedPassword]);
            res.status(200).json({ message: 'Sign up success', userId });
        } catch (error) {
            logger.error('Sign up error:', error.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    /**
     * Route de connexion des utilisateurs
     */
    router.post('/users/login', async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }

        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            const user = rows[0];
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            res.status(200).json({ message: 'Login successful', userId: user.id });
        } catch (error) {
            logger.error('Login error:', error.message);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    /**
    * ROUTES DE L'API POUR GET LES TOPICS
    */
    router.get('/topics', async (req, res) => {
        try {
            const [rows] = await db.query('SELECT id, name FROM topics');

            if (!rows.length) {
                return res.status(404).json({ message: 'Aucun topic trouvé.' });
            }

            return res.status(200).json({
                message: 'Liste des topics récupérée avec succès.',
                topics: rows
            });
        } catch (error) {
            logger.error('Erreur lors de la récupération des topics :', error.message);
            return res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
    });

    /**
     * ROUTES DE L'API POUR LES ABONNEMENTS
     */
    router.get('/subscriptions/current', async (req, res) => {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'Utilisateur non authentifié' });
        }

        try {
            const [subscriptions] = await db.query(
                'SELECT s.topic_id, t.name AS topic_name FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE s.user_id = ?',
                [userId]
            );

            return res.status(200).json(subscriptions);
        } catch (error) {
            logger.error('Erreur lors de la récupération des abonnements actuels :', error.message);
            return res.status(500).json({ message: 'Erreur interne du serveur' });
        }
    });

    /**
     * ROUTES DE L'API POUR LES MESSAGES
     */
    router.post('/topics/subscribe', async (req, res) => {
        const { selectedTopics, userId } = req.body;

        if (!selectedTopics || !Array.isArray(selectedTopics) || selectedTopics.length === 0) {
            return res.status(400).json({ message: 'Aucun topic sélectionné.' });
        }
        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        try {
            //il faut delete les anciens abonnements
            const queryDelete = 'DELETE FROM subscriptions WHERE user_id = ?';
            await db.query(queryDelete, [userId]);
            const query = 'INSERT IGNORE INTO subscriptions (user_id, topic_id) VALUES (?, ?)';
            for (const topicId of selectedTopics) {
                await db.query(query, [userId, topicId]);
            }

            return res.status(200).json({ message: 'Abonnement réussi.' });
        } catch (error) {
            logger.error('Erreur lors de l\'abonnement :', error.message);
            return res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
    });

    /**
     * ROUTES DE L'API POUR L'HISTORIQUE MESSAGES
     */
    router.get('/topics/data', async (req, res) => {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'Utilisateur non authentifié' });
        }
        /**
         * On récupère les abonnements de l'utilisateur
         */
        try {
            const [subscriptions] = await db.query(
                'SELECT s.topic_id, t.name AS topic_name FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE s.user_id = ?',
                [userId]
            );

            if (subscriptions.length === 0) {
                return res.status(404).json({ message: 'Aucun abonnement trouvé pour cet utilisateur.' });
            }

            const [messages] = await db.query(
                'SELECT m.topic_id, m.message, m.timestamp FROM messages m WHERE m.topic_id IN (?)',
                [subscriptions.map(sub => sub.topic_id)]
            );

            const result = subscriptions.map(sub => {
                const topicMessages = messages.filter(msg => msg.topic_id === sub.topic_id);
                return {
                    topicId: sub.topic_id,
                    topicName: sub.topic_name,
                    messages: topicMessages
                };
            });

            return res.status(200).json(result);
        } catch (error) {
            logger.error('Erreur lors de la récupération des abonnements et messages :', error.message);
            return res.status(500).json({ message: 'Erreur interne du serveur' });
        }
    });


    return router;
};
