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

        // Création de la table users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );
            `);
        console.log('Table `users` prête.');

        // Création de la table topics
        await connection.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
            `);
        console.log('Table `topics` prête.');

        // Création de la table messages
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message JSON NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                topic_id INT NOT NULL,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            );
            `);
        console.log('Table `messages` prête.');

        // Création de la table subscriptions
        await connection.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                user_id INT NOT NULL,
                topic_id INT NOT NULL,
                PRIMARY KEY (user_id, topic_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            );
            `);
        console.log('Table `subscriptions` prête.');

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

        const topicID = addOrGetTopicId(topic);
        addMessage(message, topicID);

    }); 

    client.on('error', (err) => {
        console.error('Erreur MQTT:', err.message);
    });

    const addOrGetTopicId = async (name) => {
        // Vérifie si le topic existe déjà
        const checkQuery = 'SELECT id FROM topics WHERE name = ?';
        const [rows] = await db.query(checkQuery, [name]);
      
        if (rows.length > 0) {
          // Si le topic existe, retourne son ID
          return rows[0].id;
        }
      
        // Si le topic n'existe pas, l'ajoute et retourne son ID
        const insertQuery = 'INSERT INTO topics (name) VALUES (?)';
        const [result] = await db.query(insertQuery, [name]);
        return result.insertId;
      };
      

    const addMessage = async (message, topicId) => {
        const query = 'INSERT INTO messages (message, topic_id) VALUES (?, ?)';
        const [result] = await db.query(query, [JSON.stringify(message), topicId]);
        return result.insertId;
    };



};



const start = async () => {
    const connection = await connectToDatabase();
    connectToMQTT(connection);
};

start();