const authRoutes = require('./auth')
const chatRoomRoutes = require('./chatroom')
const userRoutes = require('./user')
const utilityRoutes = require("./utility")
const WebSocket = require('./WebSocket')

const {uploadFile,folderType} = require('../utilities/google_drive_helper')

module.exports= (app,io)=>{
    authRoutes(app)
    chatRoomRoutes(app)
    userRoutes(app)
    WebSocket(app,io)
    utilityRoutes(app)
    app.post("/api/files/upload", async (req, res) => {
        console.log("uploading file");
        let file = req.files.lol;
        let response =await uploadFile(file.name, file.mimeType, file.data,folderType.Custom_chat_Rooms_icons)
        res.json(response)
    })
}