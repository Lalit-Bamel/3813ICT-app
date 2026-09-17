require("dotenv").config();

const { readData } = require("../utils/fileStore");
const {
    connectToMongo,
    closeMongoConnection
} = require("./mongo");

/**
 * Migrates application-level state from the Phase 1 JSON file
 * into the MongoDB appState collection.
 */
async function migrateAppState() {

    try {

        const data = readData();

        const db = await connectToMongo();

        const appStateCollection =
            db.collection("appState");

        await appStateCollection.updateOne(
            { key: "bootstrap" },
            {
                $set: {
                    completed:
                        Boolean(data.bootstrapCompleted)
                }
            },
            { upsert: true }
        );

        console.log(
            "Application state migrated to MongoDB."
        );

    } catch (error) {

        console.error(
            "Unable to migrate application state:",
            error.message
        );

    } finally {

        await closeMongoConnection();
    }
}

migrateAppState();