const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Importa e usa as rotas separadas
const authRoutes = require('./routes/auth');
const plantasRoutes = require('./routes/plantas');

app.use('/auth', authRoutes);
app.use('/plantas', plantasRoutes);

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});