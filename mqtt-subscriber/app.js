import mqtt from 'mqtt';
import mysql from 'mysql2/promise';
import { logger } from './logger.mjs';

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || '192.168.49.2',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'mqttuser',
    password: process.env.DB_PASSWORD || 'mqttpass',
    database: process.env.DB_NAME || 'mqtt_db'
};

// Configuration du broker MQTT
const mqttConfig = {
    host: process.env.BROKER_IP || '192.168.49.2',
    port: process.env.BROKER_PORT || 1883
};

// Connexion à la base de données
const connectToDatabase = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        logger.info('Connecté à la base de données MySQL.');

        // Création des tables si elles n'existent pas
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                                 email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
                );
        `);
        logger.info('Table `users` prête.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS topics (
                                                  id INT AUTO_INCREMENT PRIMARY KEY,
                                                  name VARCHAR(255) NOT NULL
                );
        `);
        logger.info('Table `topics` prête.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                                    message JSON NOT NULL,
                                                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    topic_id INT NOT NULL,
                                                    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
                );
        `);
        logger.info('Table `messages` prête.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                                                         user_id INT NOT NULL,
                                                         topic_id INT NOT NULL,
                                                         PRIMARY KEY (user_id, topic_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
                );
        `);
        logger.info('Table `subscriptions` prête.');

        return connection;
    } catch (err) {
        logger.error('Erreur de connexion à la base de données:', err.message);
        process.exit(1);
    }
};

// Connexion au broker MQTT
const connectToMQTT = (connection) => {
    const client = mqtt.connect(`mqtt://${mqttConfig.host}:${mqttConfig.port}`);

    client.on('connect', () => {
        logger.info('Connecté au broker MQTT.');
        client.subscribe('#', (err) => {
            if (err) {
                logger.error('Erreur lors de l’abonnement à tous les topics:', err.message);
            } else {
                logger.info('Abonné à tous les topics.');
            }
        });
    });

    client.on('message', async (topic, message) => {
        const payload = message.toString();
        logger.info(`Message reçu sur ${topic}: ${payload}`);

        const topicID = await addOrGetTopicId(topic);
        await addMessage(payload, topicID);
    });

    client.on('error', (err) => {
        logger.error('Erreur MQTT:', err.message);
    });

    const addOrGetTopicId = async (name) => {
        const checkQuery = 'SELECT id FROM topics WHERE name = ?';
        const [rows] = await connection.query(checkQuery, [name]);

        if (rows.length > 0) {
            return rows[0].id;
        }

        const insertQuery = 'INSERT INTO topics (name) VALUES (?)';
        const [result] = await connection.query(insertQuery, [name]);
        return result.insertId;
    };

    const addMessage = async (message, topicId) => {
        const query = 'INSERT INTO messages (message, topic_id) VALUES (?, ?)';
        await connection.query(query, [JSON.stringify(message), topicId]);
    };
};

const start = async () => {
    const connection = await connectToDatabase();
    connectToMQTT(connection);
};

start();