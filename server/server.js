const express = require("express");
const cors = require("cors");
const { readData } = require("./utils/fileStore");

const app = express();
const PORT =3000;

app.use(cors({
    origin: "http://localhost:4200"
}));

app.use(express.json());

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

app.listen(PORT,function(){
    console.log(`Server running on http://localhost:${PORT}`)
})