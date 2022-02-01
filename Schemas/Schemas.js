
const mongoose = require('mongoose')

function getModel(collectionName, schema) {
    return mongoose.model(collectionName, schema);
}
const FreindRequest = new mongoose.Schema({
    userId :mongoose.Types.ObjectId,
    requestDate:Date,
    blockDate:Date,
    acceptDate:Date,
    status:String,
    blocked:Boolean,
    sentByMe:String


})

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    birth: Date,
    joinDate: Date,
    photoUrl: String,
    thumbnailUrl :String,
    friends:[FreindRequest]
})

const attachmentSchema = new mongoose.Schema({
    name:String,
    url: String,
    type: String,
    extension: String,
    size: Number,
})

const messageSchema = new mongoose.Schema({
    sender_id:mongoose.Types.ObjectId,
    textContent: String,
    hasAttachment:Boolean,
    attachmentents: [attachmentSchema],
    send_date: Date

})

const ChatRoomSchema = new mongoose.Schema({
    name: String,
    description: String,
    photoUrl: String,
    thumbnailUrl :String,
    owner: mongoose.Types.ObjectId,
    created_Date: Date,
    message_count: Number,
    private: Boolean,
    messages: [messageSchema],
    members: [mongoose.Types.ObjectId],
    lastMessage: messageSchema
})

module.exports = {getModel,UserSchema,attachmentSchema,messageSchema,ChatRoomSchema}