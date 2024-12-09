import mqtt from 'mqtt';
import { logger } from '../logger.mjs';

const setupMQTTClient = () => {
    const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST || "192.168.2.133"}:${process.env.MQTT_PORT || "30083"}`, {
        username: process.env.MQTT_USER || 'mqttuser',
        password: process.env.MQTT_PASSWORD || 'mqttpass',
        clientId: `rest_api_${Math.random().toString(16).slice(2)}`,
    });

    client.on('connect', () => logger.info('REST API connected to MQTT broker.'));
    client.on('error', (error) => logger.error('MQTT connection error:', error.message));

    return client;
};

export default setupMQTTClient;
