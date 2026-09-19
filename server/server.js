
const {
    initialiseChatSocket
} = require("./sockets/chat.socket");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    bootstrapSuperAdmin
} = require("./bootstrap");

const http = require("http");

const path = require("path");

const uploadRoutes =
    require("./routes/uploads.routes");


const {
    connectToMongo,
    getDb
} = require("./db/mongo");

const {
    createIndexes
} = require("./db/indexes");

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
const httpServer =
    http.createServer(app);

const io =
    initialiseChatSocket(
        httpServer
    );

app.set(
    "io",
    io
);

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

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

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

app.use(
    "/api/uploads",
    uploadRoutes
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
// UNKNOWN API ROUTE
// ==================================================

app.use(
    "/api",
    function (
        req,
        res
    ) {

        return res.status(404).json({
            message:
                "API route not found."
        });
    }
);


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "Unhandled server error:",
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );
        }


        return res.status(500).json({
            message:
                "An unexpected server error occurred."
        });
    }
);

// ==================================================
// START SERVER
// ==================================================

async function startServer() {

    try {
        const db =
        await connectToMongo();
        await createIndexes(db);
        await bootstrapSuperAdmin();

        httpServer.listen(
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