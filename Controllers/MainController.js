
const authRoutes = require('./auth')
const chatRoomRoutes = require('./chatroom')
const userRoutes = require('./user')
const utilityRoutes = require("./utility")
const WebSocket = require('./WebSocket')

const { uploadFile: googleUpload, folderType } = require('../utilities/google_drive_helper')
const { uploadFile: imageKitUpload } = require('../utilities/imageKit_IO_helper.js')

module.exports = (app, io) => {
    //changing routes order will affect jwt authorization security
    authRoutes(app)
    chatRoomRoutes(app)
    userRoutes(app)
    WebSocket(app, io)
    utilityRoutes(app)
    app.post("/api/files/upload", async (req, res) => {
    
        console.log("uploading file" );
        let file = req.files.lol;

        try {
        
            let response = await imageKitUpload(file.name, file.mimetype, file.data)
            res.json(response)

        } catch (error) {
            console.log("upload failed using imageKit api" );
         
            try {
                console.log("uploading file using google api" );
                let response = await googleUpload(file.name, file.mimetype, file.data, folderType.Custom_chat_Rooms_icons)
                res.json(response)
            } catch (error) {
                res.json({
                    message:'error uploading file'
                })
                console.log("upload failed  using google api" );
            }

        }
       
    })
}