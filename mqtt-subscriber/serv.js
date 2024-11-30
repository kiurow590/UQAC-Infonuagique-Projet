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
// CORS configuration
const corsOptions = {
    origin: ["http://localhost:8080", "http://localhost:3000"], // Specify allowed origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true // Allow credentials
};

const port = process.env.PORT;

/**
 * APPLICATION
 */

app.use(cors(/*corsOptions*/)); // Configurer CORS avec les options spécifiées
app.use(express.json()); // Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/**
 * ROUTES DE L'API POUR CREER UN UTILISATEUR
 */
app.post('/users/signup', async (req, res) => {
    const { email, password } = req.body; // Supprimé le champ `name`

    logger.info('Inscription de l\'utilisateur:', email);
    logger.info('Données reçues:', req.body);

    if (!email || !password) { // Vérifie uniquement l'email et le mot de passe
        return res.status(400).send('Missing email or password');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hacher le mot de passe
        const userID = uuidv4();

        // Insertion dans la table `User`
        const [result] = await db.query(
            'INSERT INTO User (id, email, password) VALUES (?, ?, ?)',
            [userID, email, hashedPassword]
        );

        logger.debug('Utilisateur inscrit:', result);
        return res.status(200).json({ message: "Sign Up success", userId: userID }); // Retourner l'ID utilisateur
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
    const { email, password } = req.body; // Supprimé le champ `name`

    logger.info('Tentative de connexion pour l\'email:', email);

    if (!email || !password) { // Vérifiez uniquement la présence de l'email et du mot de passe
        return res.status(400).json({ message: 'Email ou mot de passe manquant' });
    }

    try {
        // Rechercher l'utilisateur par email
        const [rows] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
        const existingUser = rows[0];

        // Vérifier si l'utilisateur existe et si le mot de passe est correct
        if (!existingUser || !await bcrypt.compare(password, existingUser.password)) {
            logger.error('Utilisateur ou mot de passe incorrect pour:', email);
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        logger.info('Utilisateur connecté avec succès:', existingUser.email);
        return res.status(200).json({
            message: 'Authentification réussie',
            userId: existingUser.id // Retournez uniquement l'ID utilisateur
        });
    } catch (error) {
        logger.error('Erreur interne lors de la connexion:', error.message);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

app.get('/topics', async (req, res) => {
    try {
        // Requête pour récupérer tous les topics depuis la table "topics"
        const [rows] = await db.query('SELECT id, name FROM topics');

        // Vérifiez si la table contient des topics
        if (!rows.length) {
            return res.status(404).json({ message: 'Aucun topic trouvé.' });
        }

        // Retournez la liste des topics
        return res.status(200).json({
            message: 'Liste des topics récupérée avec succès.',
            topics: rows // Tableau contenant les topics
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des topics :', error.message);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});

app.post('/topics/subscribe', async (req, res) => {
    const { selectedTopics, userId } = req.body; // Récupère les topics sélectionnés

    // Vérifier les données de la requête
    if (!selectedTopics || !Array.isArray(selectedTopics) || selectedTopics.length === 0) {
        return res.status(400).json({ message: 'Aucun topic sélectionné.' });
    }
    if (!userId) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    try {
        // Insérer chaque abonnement dans la table `subscriptions`
        const query = 'INSERT IGNORE INTO subscriptions (user_id, topic_id) VALUES (?, ?)';
        for (const topicId of selectedTopics) {
            await db.query(query, [userId, topicId]);
        }

        // Réponse de succès
        return res.status(200).json({ message: 'Abonnement réussi.' });
    } catch (error) {
        console.error('Erreur lors de l\'abonnement :', error.message);
        return res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
});


app.get('/topics/data/:userId', async (req, res) => {
    const userId = req.body.userId; 

    // Vérifier si l'ID utilisateur est valide
    if (!userId) {
        return res.status(400).json({ message: 'Utilisateur non authentifié' });
    }

    try {
        // Récupérer les abonnements de l'utilisateur (table `subscriptions`)
        const [subscriptions] = await db.query(
            'SELECT s.topic_id, t.name AS topic_name FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE s.user_id = ?',
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'Aucun abonnement trouvé pour cet utilisateur.' });
        }

        // Récupérer les messages des abonnements (table `messages`)
        const [messages] = await db.query(
            'SELECT m.topic_id, m.message FROM messages m WHERE m.topic_id IN (?)',
            [subscriptions.map(sub => sub.topic_id)] // Récupérer les messages pour les topics abonnés
        );

        // Formater les données à envoyer
        const result = subscriptions.map(sub => {
            const topicMessages = messages.filter(msg => msg.topic_id === sub.topic_id);
            return {
                topicId: sub.topic_id,
                topicName: sub.topic_name,
                messages: topicMessages
            };
        });

        // Retourner la réponse
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des abonnements et messages :', error.message);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});


app.get('/subscriptions/current/:userId', async (req, res) => {
    const userId = req.params.userId;  // Récupérer l'ID utilisateur à partir des paramètres de l'URL

    // Vérifier si l'ID utilisateur est valide
    if (!userId) {
        return res.status(400).json({ message: 'Utilisateur non authentifié' });
    }

    try {
        // Récupérer les abonnements actuels de l'utilisateur (table `subscriptions`)
        const [subscriptions] = await db.query(
            'SELECT s.topic_id, t.name AS topic_name FROM subscriptions s JOIN topics t ON s.topic_id = t.id WHERE s.user_id = ?',
            [userId]
        );

        // Retourner la liste des abonnements sous forme de réponse
        return res.status(200).json(subscriptions);
        
    } catch (error) {
        console.error('Erreur lors de la récupération des abonnements actuels :', error.message);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});
