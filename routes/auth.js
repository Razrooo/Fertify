const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.CONNECTION_STRING
});

// Função para gerar token JWT
function gerarToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Rota de cadastro de usuário
router.post('/cadastro', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('E-mail inválido'),
    body('senha').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
], async (req, res) => {
    const erros = validationResult(req);
    if (!erros.isEmpty()) {
        return res.status(400).json({ erros: erros.array() });
    }

    const { nome, email, senha } = req.body;

    try {
        const hashSenha = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id',
            [nome, email, hashSenha]
        );

        const token = gerarToken(result.rows[0].id);
        res.status(201).json({ message: 'Usuário cadastrado!', token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'E-mail não cadastrado' });
        }

        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        const token = gerarToken(usuario.id);
        res.json({ message: 'Login realizado com sucesso!', token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
});

// Middleware de autenticação
function autenticar(req, res, next) {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'Acesso negado!' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
}

// Rota protegida (exemplo)
router.get('/perfil', autenticar, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome, email FROM usuarios WHERE id = $1', [req.usuarioId]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
});

// 👉 Exportar o router corretamente
module.exports = router;