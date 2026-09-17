require("dotenv").config();

const { readData } = require("../utils/fileStore");
const {
    connectToMongo,
    closeMongoConnection
} = require("./mongo");

/**
 * Migrates Phase 1 user data from data.json
 * into the MongoDB users collection.
 */
async function migrateUsers() {

    try {

        const data = readData();

        if (!Array.isArray(data.users)) {
            throw new Error("Users data was not found.");
        }

        const db = await connectToMongo();

        const usersCollection =
            db.collection("users");

        for (const user of data.users) {

            await usersCollection.updateOne(
                { id: user.id },
                {
                    $set: user
                },
                {
                    upsert: true
                }
            );
        }

        console.log(
            `${data.users.length} users migrated to MongoDB.`
        );

    } catch (error) {

        console.error(
            "Unable to migrate users:",
            error.message
        );

    } finally {

        await closeMongoConnection();
    }
}

migrateUsers();