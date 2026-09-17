require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    bootstrapSuperAdmin
} = require("./bootstrap");

const {
    connectToMongo,
    getDb
} = require("./db/mongo");

const authRoutes =
    require("./routes/auth.routes");

const userRoutes =
    require("./routes/users.routes");

const groupRoutes =
    require("./routes/groups.routes");

const requestRoutes =
    require("./routes/requests.routes");

const roomRoutes =
    require("./routes/rooms.routes");

const adminRoutes =
    require("./routes/admin.routes");

const app = express();

const PORT = 3000;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
    cors({
        origin: "http://localhost:4200"
    })
);

app.use(express.json());


// ==================================================
// ROUTES
// ==================================================

app.use(
    "/api",
    authRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/groups",
    groupRoutes
);

app.use(
    "/api/requests",
    requestRoutes
);

app.use(
    "/api/rooms",
    roomRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);


// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
    "/api/health",
    async function (req, res) {

        try {

            const db =
                getDb();

            const [
                users,
                groups,
                rooms,
                requests,
                messages
            ] = await Promise.all([

                db.collection("users")
                    .countDocuments(),

                db.collection("groups")
                    .countDocuments(),

                db.collection("rooms")
                    .countDocuments(),

                db.collection("requests")
                    .countDocuments(),

                db.collection("messages")
                    .countDocuments()
            ]);

            return res.json({
                message:
                    "Server is running",

                database:
                    db.databaseName,

                storage:
                    "MongoDB",

                users,
                groups,
                rooms,
                requests,
                messages
            });

        } catch (error) {

            console.error(
                "Health check error:",
                error
            );

            return res.status(500).json({
                message:
                    "Server health check failed."
            });
        }
    }
);


// ==================================================
// START SERVER
// ==================================================

async function startServer() {

    try {

        await connectToMongo();

        await bootstrapSuperAdmin();

        app.listen(
            PORT,
            function () {

                console.log(
                    `Server running on http://localhost:${PORT}`
                );
            }
        );

    } catch (error) {

        console.error(
            "Unable to start server:",
            error.message
        );
    }
}

startServer();