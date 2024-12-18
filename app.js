require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require("http")
const socketio = require("socket.io")
const { connectDB } = require("./src/database/db");
const cookieParser = require('cookie-parser');
const { preGameQueue } = require('./src/routes/queueRoutesNew');


const app = express();
const server = http.createServer(app)
const io = socketio(server);


const port = process.env.PORT || 3000;

connectDB();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


io.on("connection", socket => {
    console.log('Nuovo client connesso:', socket.id);

    socket.on('disconnect', (reason) => {
        console.log("Disconnesso dal server per:", reason);
    });

    socket.on('playerReady', ({ gameId, userId }) => {
        try {
            console.log("Messaggio ricevuto: playerReady");
    
            // Verifica che gameId e userId siano presenti
            if (!gameId || !userId) {
                console.error("gameId o userId mancante");
                return;
            }
    
            // Trova il gioco specificato
            const game = preGameQueue[gameId];
    
            if (!game) {
                console.error(`Gioco con ID ${gameId} non trovato`);
                return;
            }
    
            // Trova il giocatore specificato, confrontando con socketId
            const player = game.find(p => p.socketId === userId); // Cambiato da p.id a p.socketId
    
            if (!player) {
                console.error(`Giocatore con socketId ${userId} non trovato nel gioco ${gameId}`);
                return;
            }
    
            // Segna il giocatore come pronto
            player.pronto = true;
            console.log(`Giocatore ${player.username} è pronto per il gioco ${gameId}`);
    
            // Stampa lo stato aggiornato della preGameQueue
            console.log(preGameQueue);
    
        } catch (error) {
            console.error("Errore durante l'elaborazione dell'evento 'playerReady':", error);
        }
    });
    
    
})


app.use((req, res, next) => {
    req.io = io;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'homepage.html'));
});
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'privacy-policy.html'));
});
app.get('/register19090903', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register19090903.html'));
});
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'game.html'));
});
app.get('/gamequeue', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'gamequeue.html'));
});
app.get('/libreria', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'libreria.html'));
});
app.get('/classifiche', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'classifiche.html'));
});
app.get('/image', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'image.html'));
});

const waitingListRoute = require('./src/routes/waitingList');
const registerRoutes = require('./src/routes/registerRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const usersProfileRoute = require('./src/routes/usersProfileRoute');
const usersProfileData = require('./src/routes/usersProfileData');
const dashboardDataRoutes = require('./src/routes/dashboardData');
const queueRoutes = require('./src/routes/queueRoutes');
const queueRoutesNew = require('./src/routes/queueRoutesNew');
const searchUserRoute = require('./src/routes/searchUser');
const playersQueue = require('./src/routes/playersQueue');
const gameRoute = require('./src/routes/gameRoute');
const gameRouteData = require('./src/routes/gameRouteData');
const verifyLogIn = require('./src/routes/verifyLogIn');
const logout = require('./src/routes/logout');
const updateAvatar = require('./src/services/updateAvatar');


app.use(logout);
app.use(waitingListRoute);
app.use(verifyLogIn);
app.use(registerRoutes);
app.use(loginRoutes);
app.use(dashboardRoutes);
app.use(usersProfileRoute);
app.use(dashboardDataRoutes);
app.use(usersProfileData);
app.use(searchUserRoute);
app.use(queueRoutes);
app.use(queueRoutesNew);
app.use(gameRoute);
app.use(gameRouteData);
app.use(playersQueue);
app.use(updateAvatar);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
