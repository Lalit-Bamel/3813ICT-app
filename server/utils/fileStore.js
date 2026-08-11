const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname,"../data/data.json");

function readData(){
    const rawData = fs.readFileSync(dataFilePath,"utf8");
    return JSON.parse(rawData);
}

function writeData(data){
    fs.writeFileSync(
        dataFilePath,
        JSON.stringify(data,null,2),
        "utf8"
    );
}

module.exports= {
    readData,
    writeData
};