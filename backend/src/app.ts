import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import api from './api';
import path from 'path';

const app = express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://ecofinds-deploy.vercel.app',
        'https://*.vercel.app'
    ],
    credentials: true
}));
app.use(json());

// Serve static files from the 'public' directory
app.use(express.static(path.resolve('public')));


app.get('/', (req, res) => {
    res.send('EcoFinds API is running!');
});

app.use('/api', api);

export default app;
