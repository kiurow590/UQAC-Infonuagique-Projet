import { createServer } from 'http';
import setupWebSocket from './app/websocket.js';
import connectToDatabase from './app/database.js';
import setupMQTTClient from './app/mqttClient.js';
import { logger } from './logger.mjs';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3333;

const startWebSocketServer = async () => {
    const db = await connectToDatabase();
    const mqttClient = setupMQTTClient();
    const server = createServer();

    setupWebSocket(server, mqttClient, db);

    server.listen(port, () => {
        logger.info(`WebSocket server running on port ${port}`);
    });
};

startWebSocketServer();
