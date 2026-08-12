require("dotenv").config();

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { readData, writeData } = require("./utils/fileStore");

async function bootstrapSuperAdmin() {
    const data = readData();

    const existingSuperAdmins = data.users.filter(
        user => user.systemRole === "superAdmin"
    );

    // The system must never contain more than one Super Admin.
    if (existingSuperAdmins.length > 1) {
        throw new Error("More than one Super Administrator exists.");
    }

    // Bootstrap has already happened.
    if (data.bootstrapCompleted) {
        if (existingSuperAdmins.length !== 1) {
            throw new Error(
                "Bootstrap is marked complete but exactly one Super Administrator was not found."
            );
        }

        console.log("Super Administrator bootstrap already completed.");
        return;
    }

    // If an administrator already exists but the flag is false,
    // mark bootstrap as complete instead of creating a duplicate.
    if (existingSuperAdmins.length === 1) {
        data.bootstrapCompleted = true;
        writeData(data);

        console.log("Existing Super Administrator found. Bootstrap disabled.");
        return;
    }

    const firstName = process.env.BOOTSTRAP_ADMIN_FIRST_NAME;
    const lastName = process.env.BOOTSTRAP_ADMIN_LAST_NAME;
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const age = Number(process.env.BOOTSTRAP_ADMIN_AGE);
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

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

    if (password.length < 8 || !/[A-Z]/.test(password)) {
        throw new Error(
            "Bootstrap password must contain at least 8 characters and one uppercase letter."
        );
    }

    const passwordHash = await bcrypt.hash(password, 10);

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

    data.users.push(superAdmin);

    data.bootstrapCompleted = true;

    writeData(data);

    console.log("Initial Super Administrator created.");
}

module.exports = {
    bootstrapSuperAdmin
};