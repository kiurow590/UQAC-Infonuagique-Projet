import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.mjs';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import mqtt from 'mqtt';

//dotenv.config(); // Charger les variables d'environnement

/**
 * CONSTANTES
 */
const app = express();
// CORS configuration
const corsOptions = {
    origin: ["http://localhost:8080", "http://localhost:3000"], // Specify allowed origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true // Allow credentials
};

const port = process.env.PORT || 3000;
var userId = null;
var users = {};

/**
 * APPLICATION
 */

app.use(cors(/*corsOptions*/)); // Configurer CORS avec les options spécifiées
app.use(express.json()); // Middleware to parse JSON requests
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));


// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || '192.168.2.133',
    port: process.env.DB_PORT || 30036,
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

const options = {
    // Clean session
    clean: true,
    connectTimeout: 4000,
    // Authentication
    clientId: 'emqx_test',
    username: 'emqx_test',
    password: 'emqx_test',
}
// Connexion au broker MQTT
const mqttClient = mqtt.connect('mqtt://192.168.2.133:30083', options);

mqttClient.on('connect', async () => {
    logger.info('Connecté au broker MQTT');
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

// Start the HTTP server
const server = app.listen(3333, () => {
    logger.info(`Server is running on port ${3333}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws) => {
    logger.info('New client connected');

    ws.on('message', async (message) => {
        logger.info(`Received message: ${message}`);
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

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

/**
 * ROUTES DE L'API POUR CREER UN UTILISATEUR
 */
app.post('/users/signup', async (req, res) => {
    const { email, password } = req.body;

    logger.info('Inscription de l\'utilisateur:', email);
    logger.info('Données reçues:', { email, password });

    if (!email || !password) {
        logger.error('Email ou mot de passe manquant');
        return res.status(400).json({ message: 'Missing email or password' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        logger.info('Utilisateur inscrit en cours de creation:', email);
        logger.info('ID de l\'utilisateur:', userId);

        const query = 'INSERT INTO mqtt_db.users (id, email, password) VALUES (?, ?, ?)';
        logger.debug('Executing query:', query, [userId, email, hashedPassword]);

        const [result] = await db.query(query, [userId, email, hashedPassword]);

        logger.debug('Utilisateur inscrit:', result);
        return res.status(200).json({ message: "Sign Up success", userId: userId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            logger.error('Cet email est déjà utilisé:', error.message);
            return res.status(409).json('Cet email est déjà utilisé.');
        } else if (error.code === 'ER_BAD_NULL_ERROR') {
            logger.error('Une valeur NULL a été insérée là où elle n\'est pas autorisée:', error.message);
            return res.status(400).json('Une valeur NULL a été insérée là où elle n\'est pas autorisée.');
        } else if (error.code === 'ER_DATA_TOO_LONG') {
            logger.error('Une des valeurs insérées est trop longue:', error.message);
            return res.status(400).json('Une des valeurs insérées est trop longue.');
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
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
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


app.get('/subscriptions/current', async (req, res) => {
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


app.post('/topics/subscribe', async (req, res) => {
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

app.get('/topics/data', async (req, res) => {
    const userId = req.query.userId;

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


/**
 * DEMARRAGE DE L'API
 */
app.listen(port, () => {
    logger.info(`API démarrée sur le port ${port}`);
});
