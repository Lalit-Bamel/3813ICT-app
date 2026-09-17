require("dotenv").config();

const { readData } = require("../utils/fileStore");

const {
    connectToMongo,
    closeMongoConnection
} = require("./mongo");

/**
 * Upserts documents into a MongoDB collection using the existing UUID id.
 */
async function migrateCollection(
    db,
    collectionName,
    documents
) {

    if (!Array.isArray(documents)) {
        console.log(
            `${collectionName}: no valid source array found.`
        );
        return;
    }

    const collection =
        db.collection(collectionName);

    for (const document of documents) {

        await collection.updateOne(
            { id: document.id },
            {
                $set: document
            },
            {
                upsert: true
            }
        );
    }

    console.log(
        `${collectionName}: ${documents.length} documents migrated.`
    );
}

/**
 * Migrates the remaining Phase 1 JSON data into MongoDB.
 */
async function migrateRemainingData() {

    try {

        const data = readData();

        const db =
            await connectToMongo();

        await migrateCollection(
            db,
            "groups",
            data.groups
        );

        await migrateCollection(
            db,
            "rooms",
            data.rooms
        );

        await migrateCollection(
            db,
            "requests",
            data.requests
        );

        await migrateCollection(
            db,
            "messages",
            data.messages
        );

        await migrateCollection(
            db,
            "auditLogs",
            data.auditLogs
        );

        await migrateCollection(
            db,
            "bannedUsers",
            data.bannedUsers
        );

        console.log(
            "Remaining Phase 1 data migration completed."
        );

    } catch (error) {

        console.error(
            "Unable to migrate remaining data:",
            error.message
        );

    } finally {

        await closeMongoConnection();
    }
}

migrateRemainingData();