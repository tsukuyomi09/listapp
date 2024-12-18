const express = require('express');
const path = require('path');
const router = express.Router();
const { client } = require('../database/db'); 
const checkAuth = require('../middlewares/checkAuthToken');


router.get('/gamequeue/:game_id', checkAuth,  (req, res) => {
    // Renderizza la pagina della coda senza passare dati
    res.sendFile(path.join(__dirname, '../../views', 'gamequeue.html'));
});

// inizializza queue
router.post("/gamequeue", checkAuth, async (req, res) => {
    const user_id = req.user_id;
    try {
        const checkAvailableGameQuery = `
            SELECT game_id 
            FROM games 
            WHERE status = 'waiting' AND game_id NOT IN (
                SELECT game_id 
                FROM players_in_game 
                GROUP BY game_id 
                HAVING COUNT(*) >= 5
            )
            LIMIT 1`;

        const result = await client.query(checkAvailableGameQuery); // Esegui la query in modo sincrono

        if (result.rows.length > 0) {
            const game_id = result.rows[0].game_id;
            await addPlayerToGame(res, game_id, user_id);
        } else {
            await createNewGame(res, user_id);
        }
    } catch (err) {
        console.error("Errore nel controllo delle partite:", err);
        res.status(500).json({ message: "Errore nel controllo delle partite." });
    }
});
const addPlayerToGame = async (res, game_id, user_id) => {
    try {
        const checkPlayerCountQuery = `SELECT COUNT(*) FROM players_in_game WHERE game_id = $1`;
        
        const result = await client.query(checkPlayerCountQuery, [game_id]);
        const playerCount = parseInt(result.rows[0].count);

        if (playerCount >= 5) {
            res.status(400).json({ message: "La partita ha già 5 giocatori." });
            return;
        }

        const addToGameQuery = `
            INSERT INTO players_in_game (game_id, user_id, turn_order) 
            VALUES ($1, $2, (SELECT COALESCE(MAX(turn_order), 0) + 1 FROM players_in_game WHERE game_id = $1))`;
        
        await client.query(addToGameQuery, [game_id, user_id]);

        res.status(200).json({ game_id: game_id });

    } catch (err) {
        console.error("Errore nell'aggiungere il giocatore alla partita:", err);
        res.status(500).json({ message: "Errore nell'aggiungere alla partita." });
    }
};
const createNewGame = async (res, user_id) => {
    try {
        const createGameQuery = "INSERT INTO games (status, started_at) VALUES ('waiting', NOW()) RETURNING game_id";
        const result = await client.query(createGameQuery);

        const game_id = result.rows[0].game_id; 

        await addPlayerToGame(res, game_id, user_id);
    } catch (err) {
        console.error("Errore nella creazione della partita:", err);
        res.status(500).json({ message: "Errore nella creazione della partita." });
    }
};

// abandon queue
router.delete("/gamequeue", checkAuth, async (req, res) => {
    const user_id = req.user_id;

    // 1. Recupera il game_id associato al giocatore
    getGameIdForUser(user_id)
        .then(result => {
            if (result.rows.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "L'utente non è associato a nessun gioco." }));
                return null;  // Esci dalla catena delle promesse
            }

            const game_id = result.rows[0].game_id;
            console.log(`partita ${game_id} rimosso dalla lista`);

            // 2. Rimuovi il giocatore dalla partita
            return removePlayerFromGame(game_id, user_id).then(() => game_id); // passa game_id alla prossima .then()
        })
        .then(game_id => {
            if (game_id === null) return; // Esci se non c'è un game_id valido

            console.log(`Giocatore ${user_id} rimosso dalla partita ${game_id}`);

            // 3. Verifica il numero di giocatori nella partita
            return checkPlayerCountInGame(game_id).then(result => ({ result, game_id })); // ritorna entrambi i valori
        })
        .then(({ result, game_id }) => {
            if (game_id === undefined) return; // Esci se non c'è un game_id valido

            const playerCount = parseInt(result.rows[0].count);

            if (playerCount === 0) {
                return deleteGameIfEmpty(game_id)
                    .then(() => {
                        console.log(`La partita ${game_id} è stata cancellata, non ci sono più giocatori.`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ 
                            message: `La partita ${game_id} è stata cancellata`,
                            inGame: false
                        }));
                    });
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: `Giocatore ${user_id} rimosso, ma la partita ${game_id} ha ancora giocatori` }));
            }
        })
        .catch(err => {
            console.error(`Errore:`, err);
            if (!res.headersSent) { // Controlla che la risposta non sia già stata inviata
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Si è verificato un errore nel processo" }));
            }
        });
});

const getGameIdForUser = (user_id) => {
    const getGameIdQuery = `SELECT game_id FROM players_in_game WHERE user_id = $1 LIMIT 1`;
    
    return client.query(getGameIdQuery, [user_id]);
};

const removePlayerFromGame = (game_id, user_id) => {
    const removePlayerQuery = `DELETE FROM players_in_game WHERE game_id = $1 AND user_id = $2`;
    
    return client.query(removePlayerQuery, [game_id, user_id]);
};

const checkPlayerCountInGame = (game_id) => {
    const checkPlayerCountQuery = `SELECT COUNT(*) FROM players_in_game WHERE game_id = $1`;
    
    return client.query(checkPlayerCountQuery, [game_id]);
};

const deleteGameIfEmpty = (game_id) => {
    const deleteGameQuery = `DELETE FROM games WHERE game_id = $1`;
    
    return client.query(deleteGameQuery, [game_id]);
};


module.exports = router;