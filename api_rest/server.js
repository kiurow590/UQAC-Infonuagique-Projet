import express from 'express';
import cors from 'cors';
import connectToDatabase from './app/database.js';
import createRestApi from './app/restApi.js';
import { logger } from './logger.mjs';
import dotenv from 'dotenv';

dotenv.config();

// CONSTANTS
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;


/**
 * Start the server
 */
const startServer = async () => {
    const db = await connectToDatabase(); // Connect to the database
    app.use('/api', createRestApi(db)); // Create the REST API
    
    app.listen(port, () => {
        logger.info(`REST API running on port ${port}`);
    });
};

startServer();
