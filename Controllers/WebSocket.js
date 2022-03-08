
const { ChatRoomSchema, messageSchema, getModel } = require("../Schemas/Schemas")
const mongoose = require("mongoose");


connectedUsers = {}

module.exports = (app, io) => {


  //user presence route
  app.get("/api/user/userPresence/", (req, res) => {

    if (!req.query.userId) {
      res.status(400).send("bad request")
      return
    }

    if (connectedUsers[req.query.userId]) {
      res.json({message:"online"})
      return
    }
    res.json({message:"offline"})

  })


  io.on('connection', (socket) => {

    ChatRoomSocketEvents(socket, io)
    oneToOneEvents(socket, io)
    UserPresenceEvent(socket, io)


  });

}





function oneToOneEvents(socket, io) {

  socket.on("sendFriendRequest", (Sender, targeted) => {
    socket.to(targeted).emit("sendFriendRequest", Sender)
  })

  socket.on("removeFriendRequest", (Sender, targeted) => {
    socket.to(targeted).emit("removeFriendRequest", Sender)
  })


  socket.on("acceptFriendRequest", (Sender, targeted) => {
    socket.to(targeted).emit("acceptFriendRequest", Sender)

  })

  socket.on("privateMessage", (Sender, targeted, chatroom_id) => {
    socket.to(targeted).emit("privateMessage", Sender, chatroom_id)

  })



}

function UserPresenceEvent(socket, io) {
  socket.on("Online", userID => {


    if (!connectedUsers[userID]) {
      connectedUsers[userID] = [socket.id]
      console.log(userID + " is Online");
      io.emit("userPresence", userID, "online")
    } else {
      connectedUsers[userID].push(socket.id)
    }

    console.log(connectedUsers);


  })

  socket.on("disconnect", () => {

    let userId = socket.handshake.query.userId

    if (!connectedUsers[userId]) {
      io.emit("userPresence", userId, "offline")
      return
    }
    connectedUsers[userId] = connectedUsers[userId].filter(socketId => socketId != socket.id)
    if (connectedUsers[userId].length === 0) {
      delete connectedUsers[userId]
      console.log(userId + "is offline");
      io.emit("userPresence", userId, "offline")

    }

    console.log(connectedUsers);


  })

}

function ChatRoomSocketEvents(socket, io) {

  socket.on("joinRoom", (room_id) => {
    socket.join(room_id)
    console.log("user" + socket.id + "joined room :" + room_id);



  })

  socket.on("leaveRoom", (room_id) => {
    socket.leave(room_id)
    console.log("user" + socket.id + "left room :" + room_id);
  })
  socket.on("message", (message, roomid) => {
    addMessage(io, message, roomid)
  })
  socket.on("updateMessage", (message, roomid) => {

    updateMessage(io, message, roomid)
  })

  socket.on("deleteMessage", (message, roomid) => {

    deleteMessage(io, message, roomid)
  })
}


function addMessage(io, message, roomid) {
  let chatRoomModel = getModel("ChatRoom", ChatRoomSchema)
  chatRoomModel.findByIdAndUpdate(roomid, { $push: { messages: message } }, (err, doc) => {
    if (err) console.log(err);
    io.to(roomid).emit("message", message, roomid, doc.private)
  })
}

function updateMessage(io, message, roomid) {
  let chatRoomModel = getModel("ChatRoom", ChatRoomSchema)

  chatRoomModel.findOneAndUpdate({ "_id": roomid, "messages._id": message._id }, { $set: { "messages.$": message } }, (err, doc) => {
    if (err) console.log(err);
    io.to(roomid).emit("updateMessage", message, roomid)
  })

}

function deleteMessage(io, message, roomid) {
  let chatRoomModel = getModel("ChatRoom", ChatRoomSchema)

  chatRoomModel.findByIdAndUpdate({ "_id": roomid, "messages._id": message._id }, { $pull: { messages: { _id: message._id } } }, (err, doc) => {
    if (err) console.log(err);
    io.to(roomid).emit("deleteMessage", message, roomid)
  })


}

