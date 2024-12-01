import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.mjs';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';

/**
 * CONSTANTES
 */
const app = express();
const port = process.env.PORT || 3000;

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || '192.168.49.2',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mqttuser',
    password: process.env.DB_PASSWORD || 'mqttpass',
    database: process.env.DB_NAME || 'mqtt_db'
};

// Connexion à la base de données
const connectToDatabase = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        logger.info('Connecté à la base de données MySQL.');
        return connection;
    } catch (err) {
        logger.error('Erreur de connexion à la base de données:', err.message);
        process.exit(1);
    }
};

const db = await connectToDatabase();

/**
 * APPLICATION
 */
app.use(cors({
    origin: ["http://localhost:8080", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * ROUTES DE L'API POUR CREER UN UTILISATEUR
 */
app.post('/users/signup', async (req, res) => {
    const { email, password } = req.body;

    logger.info('Inscription de l\'utilisateur:', email);
    logger.info('Données reçues:', req.body);

    if (!email || !password) {
        return res.status(400).send('Missing email or password');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userID = uuidv4();

        const [result] = await db.query(
            'INSERT INTO User (id, email, password) VALUES (?, ?, ?)',
            [userID, email, hashedPassword]
        );

        logger.debug('Utilisateur inscrit:', result);
        return res.status(200).json({ message: "Sign Up success", userId: userID });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            logger.error('Cet email est déjà utilisé:', error.message);
            return res.status(409).json('Cet email est déjà utilisé.');
        } else {
            logger.error('Erreur Serveur lors de l\'inscription:', error.message);
            return res.status(500).send('Erreur Serveur lors de l\'inscription');
        }
    }
});

/**
 * ROUTES DE L'API POUR SE CONNECTER
 */
app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    logger.info('Tentative de connexion pour l\'email:', email);

    if (!email || !password) {
        return res.status(400).json({ message: 'Email ou mot de passe manquant' });
    }

    try {
        const [rows] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
        const existingUser = rows[0];

        if (!existingUser || !await bcrypt.compare(password, existingUser.password)) {
            logger.error('Utilisateur ou mot de passe incorrect pour:', email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        logger.info('Utilisateur connecté avec succès:', existingUser.email);
        return res.status(200).json({
            message: 'Authentification réussie',
            userId: existingUser.id
        });
    } catch (error) {
        logger.error('Erreur interne lors de la connexion:', error.message);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

/**
 * ROUTES DE L'API POUR LES TOPICS
 */
app.get('/topics', async (req, res) => {
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

app.post('/topics/subscribe', async (req, res) => {
    const { selectedTopics, userId } = req.body;

    if (!selectedTopics || !Array.isArray(selectedTopics) || selectedTopics.length === 0) {
        return res.status(400).json({ message: 'Aucun topic sélectionné.' });
    }
    if (!userId) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    try {
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

app.get('/topics/data/:userId', async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ message: 'Utilisateur non authentifié' });
    }

    try {
        const [subscriptions] = await db.query(
            'SELECT s.topic_id, t.name AS topic_name FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE s.user_id = ?',
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'Aucun abonnement trouvé pour cet utilisateur.' });
        }

        const [messages] = await db.query(
            'SELECT m.topic_id, m.message FROM messages m WHERE m.topic_id IN (?)',
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

app.get('/subscriptions/current/:userId', async (req, res) => {
    const userId = req.params.userId;

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
 * DEMARRAGE DE L'API
 */
app.listen(port, () => {
    logger.info(`API démarrée sur le port ${port}`);
});