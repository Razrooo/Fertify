const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING
});

// Rota para buscar dados da tabela 'plantas'
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plantas');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

module.exports = router;