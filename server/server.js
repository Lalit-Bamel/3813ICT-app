require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { readData } = require("./utils/fileStore");
const { bootstrapSuperAdmin } = require("./bootstrap");
const { connectToMongo, getDb } = require("./db/mongo");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const groupRoutes = require("./routes/groups.routes");
const requestRoutes = require("./routes/requests.routes");
const roomRoutes = require("./routes/rooms.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: "http://localhost:4200"
    })
);

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", function (req, res) {

    const data = readData();
    const db = getDb();

    res.json({
        message: "Server is running",
        mongoDatabase: db.databaseName,
        phase1Storage: "JSON storage still active during migration",
        users: data.users.length,
        groups: data.groups.length,
        rooms: data.rooms.length
    });
});

async function startServer() {

    try {

        await connectToMongo();

        await bootstrapSuperAdmin();

        app.listen(PORT, function () {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Unable to start server:",
            error.message
        );
    }
}

startServer();