import mysql from 'mysql2/promise';
import { logger } from '../logger.mjs';
import dotenv from 'dotenv';

dotenv.config();
const connectToDatabase = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '192.168.2.133',
            port: process.env.DB_PORT || 30036,
            user: process.env.DB_USER || 'mqttuser',
            password: process.env.DB_PASSWORD || 'mqttpass',
            database: process.env.DB_NAME || 'mqtt_db',
        });
        logger.info('Connected to MySQL database.');
        return connection;
    } catch (error) {
        logger.error('Error connecting to database:', error.message);
        process.exit(1);
    }
};

export default connectToDatabase;
