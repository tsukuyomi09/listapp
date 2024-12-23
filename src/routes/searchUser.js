// routes/users.js
const express = require('express');
const router = express.Router();
const { client } = require('../database/db');
const checkAuth = require('../middlewares/checkAuthToken');

// Route per la ricerca utenti
router.get('/search-users', checkAuth, async (req, res) => {
    const query = req.query.username?.toLowerCase(); // Ottieni il parametro 'username'

    if (!query || query.length < 3) {
        return res.status(400).json({ error: 'La query deve contenere almeno 3 caratteri' });
    }

    try {
        const result = await client.query(
            'SELECT username, avatar FROM users WHERE username ILIKE $1 LIMIT 10', 
            [`%${query}%`] // La ricerca avviene per pattern '%query%'
        );

        if (result.rows.length === 0) {
            return res.json([]); // Nessun utente trovato
        }

        return res.json(result.rows); // Restituisce gli utenti trovati

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Errore durante la ricerca' });
    }
});

module.exports = router;
