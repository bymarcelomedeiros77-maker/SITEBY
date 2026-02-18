import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.VESTI_API_KEY;
const COMPANY_ID = process.env.VESTI_COMPANY_ID;
const VESTI_API_URL = process.env.VESTI_API_URL;

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Proxy para API Vesti
app.use('/api/vesti', async (req, res) => {
    try {
        const endpoint = req.path; // req.path is relative to the mount point '/api/vesti'
        // If req.path is just '/', we might need to handle it, but usually it's '/v1/...'
        const url = `${VESTI_API_URL}${endpoint}`;

        console.log(`[${new Date().toISOString()}] ${req.method} ${url}`);

        // Headers
        const headers = {
            'apikey': API_KEY,
            'Company-Id': COMPANY_ID
        };

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            method: req.method,
            headers: headers,
            body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : undefined,
            timeout: 30000
        });

        const responseText = await response.text();

        console.log(`[${new Date().toISOString()}] Response Status: ${response.status}`);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = responseText;
        }

        res.status(response.status).json(data);

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Erro:`, error.message);
        res.status(500).json({
            error: error.message,
            timestamp: new Date()
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`CORS habilitado`);
    console.log(`API Vesti URL: ${VESTI_API_URL}`);
});
