import mqtt from 'mqtt';
import mysql from 'mysql2/promise';

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
        console.log('Connecté à la base de données MySQL.');

        // Création de la table si elle n'existe pas
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                topic VARCHAR(255) NOT NULL,
                payload TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createTableQuery);
        console.log('Table `messages` prête.');

        return connection;
    } catch (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        process.exit(1);
    }
};

// Connexion au broker MQTT
const connectToMQTT = (connection) => {
    const client = mqtt.connect(`mqtt://${mqttConfig.host}:${mqttConfig.port}`);

    client.on('connect', () => {
        console.log('Connecté au broker MQTT.');
        client.subscribe('test/topic', (err) => {
            if (err) {
                console.error('Erreur lors de l’abonnement au topic:', err.message);
            } else {
                console.log('Abonné au topic `test/topic`.');
            }
        });
    });

    client.on('message', async (topic, message) => {
        const payload = message.toString();
        console.log(`Message reçu sur ${topic}: ${payload}`);

        // Insertion dans la base de données
        const insertQuery = 'INSERT INTO messages (topic, payload) VALUES (?, ?)';
        try {
            await connection.query(insertQuery, [topic, payload]);
            console.log('Message inséré avec succès.');
        } catch (err) {
            console.error('Erreur lors de l’insertion en base de données:', err.message);
        }
    });

    client.on('error', (err) => {
        console.error('Erreur MQTT:', err.message);
    });
};

const start = async () => {
    const connection = await connectToDatabase();
    connectToMQTT(connection);
};

start();