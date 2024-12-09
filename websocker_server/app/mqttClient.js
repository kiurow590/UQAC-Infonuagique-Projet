import mqtt from 'mqtt';
import { logger } from '../logger.mjs';

const setupMQTTClient = () => {
    const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST || "192.168.2.133"}:${process.env.MQTT_PORT || "30083"}`, {
        username: process.env.MQTT_USER || 'mqttuser',
        password: process.env.MQTT_PASSWORD || 'mqttpass',
    });

    client.on('connect', () => {
        logger.info('Connected to MQTT broker');
        client.subscribe('#', (err) => {
            if (err) {
                logger.error('Failed to subscribe to topics:', err.message);
            } else {
                logger.info('Subscribed to all topics');
            }
        });
    });

    client.on('error', (err) => {
        logger.error('MQTT error:', err.message);
    });
    return client;
};

export default setupMQTTClient;
