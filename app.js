require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require("http")
const socketio = require("socket.io")
const { connectDB } = require("./src/database/db");
const cookieParser = require('cookie-parser');


const app = express();
const server = http.createServer(app)
const io = socketio(server);

io.on("connection", socket => {
    console.log('Nuovo client connesso:', socket.id);

    socket.on('disconnect', (reason) => {
        console.log("Disconnesso dal server per:", reason);
    });
})

const port = process.env.PORT || 3000;

connectDB();

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.use((req, res, next) => {
    req.io = io;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'game.html'));
});
app.get('/gamequeue', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'gamequeue.html'));
});
app.get('/storie', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'storie.html'));
});
app.get('/classifiche', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'classifiche.html'));
});
app.get('/image', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'image.html'));
});

const registerRoutes = require('./src/routes/registerRoutes');
const loginRoutes = require('./src/routes/loginRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const dashboardDataRoutes = require('./src/routes/dashboardData');
const queueRoutes = require('./src/routes/queueRoutes');
const queueRoutesNew = require('./src/routes/queueRoutesNew');
const playersQueue = require('./src/routes/playersQueue');
const verifyLogIn = require('./src/routes/verifyLogIn');
const logout = require('./src/routes/logout');
const updateAvatar = require('./src/services/updateAvatar');

app.use(logout);
app.use(verifyLogIn);
app.use(registerRoutes);
app.use(loginRoutes);
app.use(dashboardRoutes);
app.use(dashboardDataRoutes);
app.use(queueRoutes);
app.use(queueRoutesNew);
app.use(playersQueue);
app.use(updateAvatar);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
