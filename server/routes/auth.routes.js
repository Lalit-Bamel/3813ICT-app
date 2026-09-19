const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { getDb } = require("../db/mongo");

const router = express.Router();

/**
 * Removes sensitive and database-only fields before returning a user.
 */
function getSafeUser(user) {
    const {
        passwordHash,
        _id,
        ...safeUser
    } = user;

    return safeUser;
}

/**
 * Escapes special RegExp characters in user input.
 */
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// ==================================================
// REGISTER
// ==================================================

router.post("/register", async function (req, res) {

    try {

        const {
            firstName,
            lastName,
            username,
            email,
            age,
            password
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !username ||
            !email ||
            age === undefined ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "All required fields must be provided."
            });
        }

        const cleanFirstName =
            firstName.trim();

        const cleanLastName =
            lastName.trim();

        const cleanUsername =
            username.trim();

        const cleanEmail =
            email.trim().toLowerCase();

        const numericAge =
            Number(age);

        if (
            !cleanFirstName ||
            !cleanLastName ||
            !cleanUsername
        ) {
            return res.status(400).json({
                message:
                    "Name and username cannot be empty."
            });
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                message:
                    "A valid email address is required."
            });
        }

        if (
            !Number.isInteger(numericAge) ||
            numericAge < 0
        ) {
            return res.status(400).json({
                message:
                    "A valid age is required."
            });
        }

        if (
            password.length < 8 ||
            !/[A-Z]/.test(password)
        ) {
            return res.status(400).json({
                message:
                    "Password must contain at least 8 characters and one uppercase letter."
            });
        }

        const db =
            getDb();

        const usersCollection =
            db.collection("users");

        const bannedUsersCollection =
            db.collection("bannedUsers");

        const emailExists =
            await usersCollection.findOne({
                email: cleanEmail
            });

        if (emailExists) {
            return res.status(409).json({
                message:
                    "Email address is already registered."
            });
        }

        const usernameExists =
            await usersCollection.findOne({
                username: {
                    $regex:
                        `^${escapeRegex(cleanUsername)}$`,
                    $options: "i"
                }
            });

        if (usernameExists) {
            return res.status(409).json({
                message:
                    "Username is already in use."
            });
        }

        const bannedEmail =
            await bannedUsersCollection.findOne({
                email: cleanEmail
            });

        if (bannedEmail) {
            return res.status(403).json({
                message:
                    "This email address cannot be registered."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );

        const newUser = {
            id: crypto.randomUUID(),
            firstName: cleanFirstName,
            lastName: cleanLastName,
            username: cleanUsername,
            email: cleanEmail,
            age: numericAge,
            passwordHash: passwordHash,
            profilePicture: "",
            systemRole: "user",
            createdAt:
                new Date().toISOString()
        };

        await usersCollection.insertOne(
            newUser
        );

        return res.status(201).json({
            message:
                "Account created successfully.",
            user:
                getSafeUser(newUser)
        });

    } catch (error) {
        if (
    error.code === 11000
) {

    if (
        error.keyPattern?.email
    ) {

        return res.status(409).json({
            message:
                "Email address is already registered."
        });
    }


    if (
        error.keyPattern?.username
    ) {

        return res.status(409).json({
            message:
                "Username is already in use."
        });
    }


    return res.status(409).json({
        message:
            "Account information is already in use."
    });
}

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to create account."
        });
    }
});


// ==================================================
// LOGIN
// ==================================================

router.post("/login", async function (req, res) {

    try {

        const {
            username,
            password
        } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message:
                    "Username and password are required."
            });
        }

        const cleanUsername =
            username.trim();

        const db =
            getDb();

        const usersCollection =
            db.collection("users");

        const user =
            await usersCollection.findOne({
                username: {
                    $regex:
                        `^${escapeRegex(cleanUsername)}$`,
                    $options: "i"
                }
            });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid username or password."
            });
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.passwordHash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                message:
                    "Invalid username or password."
            });
        }

        return res.json({
            message:
                "Login successful.",
            user:
                getSafeUser(user)
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to log in."
        });
    }
});

module.exports = router;