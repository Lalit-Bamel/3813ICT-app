const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { getDb } = require("./db/mongo");

/**
 * Ensures that exactly one Super Administrator exists.
 * The bootstrap process can only create the initial Super Administrator once.
 */
async function bootstrapSuperAdmin() {

    const db = getDb();

    const usersCollection =
        db.collection("users");

    const appStateCollection =
        db.collection("appState");

    const existingSuperAdmins =
        await usersCollection
            .find({ systemRole: "superAdmin" })
            .toArray();

    // The system must never contain more than one Super Admin.
    if (existingSuperAdmins.length > 1) {
        throw new Error(
            "More than one Super Administrator exists."
        );
    }

    const bootstrapState =
        await appStateCollection.findOne({
            key: "bootstrap"
        });

    const bootstrapCompleted =
        Boolean(bootstrapState?.completed);

    // Bootstrap has already been completed.
    if (bootstrapCompleted) {

        if (existingSuperAdmins.length !== 1) {
            throw new Error(
                "Bootstrap is marked complete but exactly one Super Administrator was not found."
            );
        }

        console.log(
            "Super Administrator bootstrap already completed."
        );

        return;
    }

    // If a Super Admin already exists but bootstrap is not marked complete,
    // repair the application state instead of creating a duplicate account.
    if (existingSuperAdmins.length === 1) {

        await appStateCollection.updateOne(
            { key: "bootstrap" },
            {
                $set: {
                    completed: true
                }
            },
            {
                upsert: true
            }
        );

        console.log(
            "Existing Super Administrator found. Bootstrap disabled."
        );

        return;
    }

    const firstName =
        process.env.BOOTSTRAP_ADMIN_FIRST_NAME;

    const lastName =
        process.env.BOOTSTRAP_ADMIN_LAST_NAME;

    const username =
        process.env.BOOTSTRAP_ADMIN_USERNAME;

    const email =
        process.env.BOOTSTRAP_ADMIN_EMAIL;

    const age =
        Number(process.env.BOOTSTRAP_ADMIN_AGE);

    const password =
        process.env.BOOTSTRAP_ADMIN_PASSWORD;

    if (
        !firstName ||
        !lastName ||
        !username ||
        !email ||
        !age ||
        !password
    ) {
        throw new Error(
            "Bootstrap Super Administrator environment variables are missing."
        );
    }

    if (
        password.length < 8 ||
        !/[A-Z]/.test(password)
    ) {
        throw new Error(
            "Bootstrap password must contain at least 8 characters and one uppercase letter."
        );
    }

    const existingAccount =
        await usersCollection.findOne({
            $or: [
                { username: username },
                { email: email.toLowerCase() }
            ]
        });

    if (existingAccount) {
        throw new Error(
            "Bootstrap username or email is already in use."
        );
    }

    const passwordHash =
        await bcrypt.hash(password, 10);

    const superAdmin = {
        id: crypto.randomUUID(),
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email.toLowerCase(),
        age: age,
        passwordHash: passwordHash,
        profilePicture: "",
        systemRole: "superAdmin",
        createdAt: new Date().toISOString()
    };

    await usersCollection.insertOne(
        superAdmin
    );

    await appStateCollection.updateOne(
        { key: "bootstrap" },
        {
            $set: {
                completed: true
            }
        },
        {
            upsert: true
        }
    );

    console.log(
        "Initial Super Administrator created."
    );
}

module.exports = {
    bootstrapSuperAdmin
};