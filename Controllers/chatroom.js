
const { getModel, UserSchema, ChatRoomSchema } = require('../Schemas/Schemas')
const { Types } = require('mongoose')
module.exports = (app) => {

    app.get("/api/chatroom/", async (req, res) => {

        let room_id = req.query.room_id;



        if (!room_id) {
            res.status(400).send('Bad Request')
            return;
        }

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        let value = await chatroomModel.findById(room_id, { messages: { $slice: -10 } }).exec()
        res.json(value)
        res.end()
    })

    



    app.get("/api/chatroom/unseenMessagesCountPerRoom", async (req, res) => {
        let date = req.query.date;
        let chatroom_id = req.query.chatroom_id
        if (!date || !chatroom_id) {
            res.status(400).send('Bad Request')
            return
        }
        date = date.trim().replace(" ", '+')

        if (date == "Invalid Date") {
            res.status(400).send('Bad Request')
            return
        }


        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        chatroomModel.aggregate([
            { $match: { _id: Types.ObjectId(req.query.chatroom_id) } },
            { $unwind: "$messages" },
            { $match: { "messages.send_date": { $gt: new Date(date) } } },
            { $count: "messages" }

        ], (err, doc) => {
            if(doc.length>0){
                res.json({
                    count:doc[0].messages
                })
            }else{
                res.json({
                    count:0
                })
            }
           
        })
    })
    app.get("/api/chatroom/bymember", async (req, res) => {

        let userId = req.query.member_id;
        let private = req.query.private


        if (!userId) {
            res.status(400).send('Bad Request')
            return;
        }

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        let value = await chatroomModel.find({ members: userId, private }, { messages: { $slice: -1 } }).exec()
        res.json(value)
        res.end()
    })


    app.get("/api/chatroom/currentUser", async (req, res) => {

        let userId = req.headers["user_id"]
        let private = req.query.private

        if (!userId) {
            res.status(400).send('Bad Request')
            return;
        }

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        let value = await chatroomModel.find({ members: userId, private: private }, { messages: { $slice: -1 } }).exec()
        res.json(value)
        res.end()
    })




    app.get("/api/chatroom/getMessages", async (req, res) => {

        let roomID = req.query.room_id;
        let arrayLength = req.query.length
        let elementCounts = req.query.elementCounts;

        if (!roomID || !arrayLength || !elementCounts) {
            res.status(400).send('Bad Request')
            return;
        }
        arrayLength = parseInt(arrayLength)
        elementCounts = parseInt(elementCounts)

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        let value = await chatroomModel.findById(roomID, { messages: { $slice: [-(arrayLength + elementCounts), elementCounts] } }).exec()
        await new Promise(x => setTimeout(x, 2000))
        res.json(value)

    })


    app.post("/api/chatroom/createPrivateRoom", async (req, res) => {
        let userId = req.headers['user_id']
        let otherUserId = req.body.userId

        if (!userId || !otherUserId) {
            res.status(400).send('Bad Request')
            return
        }

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)

        chatroomModel.findOne({ members: { $all: [userId, otherUserId] }, private: true }, { messages: 0 }, (err, doc) => {
            if (err) console.log(err);
            if (doc) {
                doc.created = false
                res.json(doc)
                return
            }

            chatroomModel.create({

                created_Date: new Date(),
                message_count: 0,
                private: true,
                messages: [],
                members: [userId, otherUserId],
                lastMessage: null
            }, (err, doc) => {
                if (err) console.log(err);
                doc.created = true;
                res.json(doc)
            })
        })


    })
    app.post("/api/chatroom/create", async (req, res) => {
        let body = req.body;
        body.owner = req.headers['user_id']
        body.members = [req.headers['user_id']]
        if (!body.name || !body.owner) {
            res.status(400).send('Bad Request')
            return
        }
        body.message_count = 0


        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        let chatroomDocument = new chatroomModel(body)
        saved_doc = await chatroomDocument.save()
        res.json(saved_doc)
    })


    app.put("/api/chatroom/update", (req, res) => {

        let body = req.body;
        if (!body.room_id || !body.name || !body.description) {
            res.status(400).send('Bad Request')

            return;
        }
        let updateObject = {}

        updateObject["name"] = body.name
        updateObject["description"] = body.description

        if (body.photoUrl) {
            updateObject["photoUrl"] = body.photoUrl
            updateObject["thumbnailUrl"] = body.thumbnailUrl
        }

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        chatroomModel.findByIdAndUpdate(body.room_id, updateObject, (err, doc) => {
            if (err) console.log(err);
            res.json(doc)
        })
    })

    app.delete("/api/chatroom/delete", (req, res) => {
        let id = req.query.chatroom_id;

        if (!id) {
            res.status(400).send('Bad Request')
            return;
        }

        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        chatroomModel.findByIdAndDelete(id, (err, doc) => {
            if (err) console.log(err);
            res.json(doc)
        })
    })

    app.put("/api/chatroom/addMember", (req, res) => {
        let body = req.body
        let member_id = req.headers["user_id"]

        if (!member_id || !body.chatroom_id) {
            res.status(400).send('Bad Request')
            return;
        }
        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        chatroomModel.findOneAndUpdate({ _id: body.chatroom_id, private: false }, { $addToSet: { members: member_id } }, (err, doc) => {
            if (err) console.log(err);
            if (doc) {
                res.json(doc)
                return
            }

            res.status(404).send('not found')
        }).select("_id")


    })

    app.put("/api/chatroom/leaveRoom", (req, res) => {
        let body = req.body
        let member_id = req.headers["user_id"]

        if (!member_id || !body.chatroom_id) {
            res.status(400).send('Bad Request')
            return;
        }
        let chatroomModel = getModel('ChatRoom', ChatRoomSchema)
        chatroomModel.findOneAndUpdate({ _id: body.chatroom_id, private: false }, { $pull: { members: member_id } }, (err, doc) => {
            if (err) console.log(err);
            if (doc) {
                res.json(doc)
                return
            }

            res.status(404).send('not found')
        }).select("_id")


    })


}