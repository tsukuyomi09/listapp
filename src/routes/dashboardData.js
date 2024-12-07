const express = require('express');
const router = express.Router();
const checkAuth = require('../middlewares/checkAuthToken');
const checkUserStatus = require('../middlewares/checkUserStatus');

router.get("/dashboardData", checkAuth, async (req, res) => {
    try {
        const { username, status } = req;  // Recupera il `username` direttamente da `req`

        if (!username) {
            return res.status(404).json({ error: "Username non trovato" });
        }

        // Puoi restituire direttamente lo `username` senza fare una query al database
        res.status(200).json({ username, status });

    } catch (err) {
        console.error("Errore durante il recupero dello username:", err);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;

