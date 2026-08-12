
const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { readData, writeData } = require("../utils/fileStore");

const router = express.Router();

function getSafeUser(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
}


// REGISTER
router.post("/register", async function(req, res) {
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
                message: "All required fields must be provided."
            });
        }

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        const numericAge = Number(age);

        if (!cleanFirstName || !cleanLastName || !cleanUsername) {
            return res.status(400).json({
                message: "Name and username cannot be empty."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                message: "A valid email address is required."
            });
        }

        if (
            !Number.isInteger(numericAge) ||
            numericAge < 0
        ) {
            return res.status(400).json({
                message: "A valid age is required."
            });
        }

        if (password.length < 8 || !/[A-Z]/.test(password)) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters and one uppercase letter."
            });
        }

        const data = readData();

        const emailExists = data.users.some(
            user => user.email.toLowerCase() === cleanEmail
        );

        if (emailExists) {
            return res.status(409).json({
                message: "Email address is already registered."
            });
        }

        const usernameExists = data.users.some(
            user => user.username.toLowerCase() === cleanUsername.toLowerCase()
        );

        if (usernameExists) {
            return res.status(409).json({
                message: "Username is already in use."
            });
        }

        const bannedEmail = data.bannedUsers.some(
            bannedUser =>
                bannedUser.email &&
                bannedUser.email.toLowerCase() === cleanEmail
        );

        if (bannedEmail) {
            return res.status(403).json({
                message: "This email address cannot be registered."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

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
            createdAt: new Date().toISOString()
        };

        data.users.push(newUser);

        writeData(data);

        return res.status(201).json({
            message: "Account created successfully.",
            user: getSafeUser(newUser)
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Unable to create account."
        });
    }
});


// LOGIN
router.post("/login", async function(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

        const data = readData();

        const user = data.users.find(
            currentUser =>
                currentUser.username.toLowerCase() ===
                username.trim().toLowerCase()
        );

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        return res.json({
            message: "Login successful.",
            user: getSafeUser(user)
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Unable to log in."
        });
    }
});

module.exports = router;