const express = require("express");
const cors = require("cors");
const { readData } = require("./utils/fileStore");
const { bootstrapSuperAdmin } = require("./bootstrap");
const  authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes")
const app = express();
const PORT =3000;
const groupRoutes = require("./routes/groups.routes");
const requestRoutes = require("./routes/requests.routes");
const roomRoutes =
    require("./routes/rooms.routes");

const adminRoutes =
    require("./routes/admin.routes");


app.use(cors({
    origin: "http://localhost:4200"
}));

app.use(express.json());
app.use("/api",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/rooms", roomRoutes);
app.use(
    "/api/admin",
    adminRoutes
);
app.get("/api/health", function(req, res) {
    const data = readData();

    res.json({
        message: "Server is running",
        storage: "JSON storage connected",
        users: data.users.length,
        groups: data.groups.length,
        rooms: data.rooms.length
    });
});

async function startServer() {
    try {
        await bootstrapSuperAdmin();
        app.listen(PORT, function(){
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log("Unable to start server:", error.message);
    }
}

startServer();