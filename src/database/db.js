const { Client } = require("pg");

const client = new Client ({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
})

const connectDB = async () => {
    try {
        await client.connect();
        console.log('Connesso al database');
    } catch (err) {
        console.error('Errore di connessione:', err.stack);
    }
};

module.exports = { client, connectDB };