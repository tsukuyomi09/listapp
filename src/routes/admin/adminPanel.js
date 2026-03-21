require("dotenv").config();
const { client } = require("../../database/db");
const express = require("express");
const router = express.Router();
const { activeGames } = require("../../services/gameManager");

router.post("/", async (req, res) => {
    const { username, password } = req.body;

    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASS
    ) {
        console.log("Correct credentials, proceeding");

        try {
            const usersData = await client.query(`
                SELECT
                COUNT(*) FILTER (WHERE last_seen_at > NOW() - INTERVAL '2 minutes') AS users_online,
                COUNT(*) FILTER (WHERE last_seen_at >= CURRENT_DATE) AS users_active_today,
                COUNT(*) FILTER (WHERE last_seen_at >= CURRENT_DATE - INTERVAL '7 days') AS users_active_week,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS users_registered_today,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS users_registered_week
                FROM users;`);

            const gameData = await client.query(`
                SELECT
                    COUNT(*) FILTER (WHERE finished_at >= CURRENT_DATE) AS games_completed_today,
                    COUNT(*) FILTER (WHERE finished_at >= CURRENT_DATE - INTERVAL '7 days') AS games_completed_week
                FROM games_completed;
            `);

            const activeGamesData = {
                count: activeGames.size,
                gameIds: Array.from(activeGames.keys()),
            };

            // da activeGames, prendiamo i games e il loro id. questa la struttura della mappa "activeGames"

            //         activeGames.set(newGameId, {
            //             gameId: newGameId,
            //             gameType: gameType,
            //             gameSpeed: gameSpeed,
            //             publishStatus: null,
            //             votes: {},
            //             players: players,
            //             chapters: [],
            //             chapterReadMap: new Map(),
            //             status: "to-start",
            //             turnOrder: turnOrder,
            //             readyPlayersCount: new Set(),
            //             chat: [],
            //             turnIndex: 0,
            //             connections: [],
            //             countdownDuration: countdownDuration,
            //             countdownStart: null,
            //             countdownEnd: null,
            //             countdownInterval: null,
            //             startedAt: new Date(),
            //         });

            // quindi prendiamo solo la lista dei gameId.. cioé mandiamo indietro il numero totale di games, e a lista
            const panelData = {
                users: usersData.rows[0],
                gamesCompleted: gameData.rows[0],
                activeGames: activeGamesData,
            };
            return res.status(200).json({ panelData });
        } catch (error) {
            console.error("Internal error:", error);
            return res
                .status(500)
                .json({ message: `Server error,, ${error.message || error}` });
        }
    } else {
        return res.status(400).json({ message: "Incorrect credentials" });
    }
});

module.exports = router;
