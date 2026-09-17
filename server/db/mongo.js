const { MongoClient } = require('mongodb');

const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';

const dbName =
    process.env.MONGO_DB_NAME || 'fabulari';

let client = null;
let db = null;

/**
 * Connects the Node.js server to MongoDB.
 * Reuses the existing connection if one has already been created.
 */
async function connectToMongo() {

    if (db) {
        return db;
    }

    client = new MongoClient(mongoUri);

    await client.connect();

    db = client.db(dbName);

    console.log(
        `Connected to MongoDB database: ${dbName}`
    );

    return db;
}

/**
 * Returns the active MongoDB database connection.
 */
function getDb() {

    if (!db) {
        throw new Error(
            'MongoDB connection has not been established.'
        );
    }

    return db;
}

/**
 * Closes the MongoDB client connection.
 */
async function closeMongoConnection() {

    if (client) {
        await client.close();

        client = null;
        db = null;
    }
}

module.exports = {
    connectToMongo,
    getDb,
    closeMongoConnection
};