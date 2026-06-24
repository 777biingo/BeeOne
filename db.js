require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.DB_URI);
let db;

async function connectDB() {
    await client.connect();
    db = client.db('beebot');
    await db.collection('users').createIndex({ userId: 1 }, { unique: true });
    console.log("Połączono z bazą danych");
}

function getDb() { return db; }

module.exports = { connectDB, getDb };
