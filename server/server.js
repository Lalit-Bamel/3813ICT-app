const express = require("express");
const cors = require("cors");

const app = express();
const PORT =3000;

app.use(cors({
    origin: "http://localhost:4200"
}));

app.use(express.json());

app.get("/api/health",function(req,res){
    res.json({
        message:"Server is running"
    });
});

app.listen(PORT,function(){
    console.log(`Server running on http://localhost:${PORT}`)
})