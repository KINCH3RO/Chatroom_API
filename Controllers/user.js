const { getModel, UserSchema } = require('../Schemas/Schemas')
const bcrypt = require('bcrypt')
function getHash(text, saltRounds) {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(text, salt);
    return hash;

}

function makeRequest(userId, byme = false) {
    return {
        userId: userId,
        requestDate: new Date(),
        blockDate: null,
        acceptDate: null,
        blocked: false,
        status: 'pending',
        sentByMe: byme
    }

}
module.exports = (app) => {

    app.get("/api/user/search/", (req, res) => {


        let searchQuery = req.query.searchQuery
        if (!searchQuery) {
            res.json([])
            return
        }

        let UserModel = getModel('Users', UserSchema);
        let regex = RegExp(searchQuery, 'i')

        UserModel.find({ username: regex }).limit(10).exec((err, doc) => {
            if (err) console.log(err);
            res.json(doc)
        })
    })

    app.get("/api/user/friendStatus/", (req, res) => {


        let friend_id = req.query.friend_id
        let user_id = req.headers["user_id"]
        if (!friend_id || !user_id) {
            res.status(400).send("bad request")
            return
        }

        let UserModel = getModel('Users', UserSchema);
        UserModel.findOne({_id:user_id,'friends.userId':friend_id},{'friends.$':1},(err,doc)=>{
            if(err) console.log(err);
            if(doc){
                res.json(doc.friends[0])
                return
            }
            res.status(404).send("friend not found")
            
        })
     
    })



    app.post("/api/user/sendFriendRequest/", async (req, res) => {

        let senderId = req.headers["user_id"]
        let receiverId = req.body.receiver_id
        if (!senderId || !receiverId) {
            res.status(400).send("bad request")
            return
        }

        let UserModel = getModel('Users', UserSchema);

        let requestExist = await UserModel.findOne({ _id: senderId, 'friends.userId': receiverId })
        if (requestExist) {
            res.status(402).send("Your request is : " + requestExist.friends[0].status)
            return
        }


        let senderRequest = makeRequest(receiverId, true)
        let receiverRequest = makeRequest(senderId, false)
        UserModel.findByIdAndUpdate(senderId, { $push: { friends: senderRequest } }, (err, doc) => {
            if (doc) {
                UserModel.findByIdAndUpdate(receiverId, { $push: { friends: receiverRequest } }, (err, doc) => {
                    if (doc) {
                        res.status(200).send("success")
                    }
                })
            }
        })

    })

    app.post("/api/user/acceptFriendRequest", async (req, res) => {
        let firstUserId = req.headers["user_id"]
        let secondUserId = req.body.otherUser
        if (!firstUserId || !secondUserId) {
            res.status(400).send('bad request')
            return
        }

        let UserModel = getModel('Users', UserSchema);

        let requestExist = await UserModel.findOne({ _id: firstUserId, 'friends.userId': secondUserId })
        if (!requestExist) {
            res.status(402).send("Your request is unavailable")
            return
        }
        UserModel.findOneAndUpdate({ _id: firstUserId, 'friends.userId': secondUserId }, { $set: { 'friends.$.status': 'accepted' } }, (err, doc) => {
            if (doc) {
                UserModel.findOneAndUpdate({ _id: secondUserId, 'friends.userId': firstUserId }, { $set: { 'friends.$.status': 'accepted' } }, (err, doc) => {
                    if (doc) {
                        res.json(doc)
                    }
                })

            }
        })

    })

    app.post("/api/user/removeFriendRequest", async (req, res) => {


        let firstUserId = req.headers["user_id"]
        let secondUserId = req.body.otherUser
        if (!firstUserId || !secondUserId) {
            res.status(400).send('bad request')
            return
        }

        let UserModel = getModel('Users', UserSchema);

        let requestExist = await UserModel.findOne({ _id: firstUserId, 'friends.userId': secondUserId })
        if (!requestExist) {
            res.status(402).send("Your request is unavailable")
            return
        }
        UserModel.findOneAndUpdate({ _id: firstUserId, 'friends.userId': secondUserId }, { $pull: { friends: { userId: secondUserId } } }, (err, doc) => {
            if (doc) {
                UserModel.findOneAndUpdate({ _id: secondUserId, 'friends.userId': firstUserId }, { $pull: { friends: { userId: firstUserId } } }, (err, doc) => {
                    if (doc) {
                        res.json(doc)
                    }
                })

            }
        })

    })

    app.post("/api/user/blockUser", (req, res) => {
        let UserModel = getModel('Users', UserSchema);


    })


    app.get("/api/user/", async (req, res) => {


        
        user_id = req.query.user_id || req.headers["user_id"]
        if (!req.query.compact || !user_id) {
            res.status(400).send('Bad Request')
            return;
        }
        let UserModel = getModel('Users', UserSchema);
        let user = null
        if (req.query.compact == "true") {
            user = await UserModel.findById(user_id, 'username photoUrl thumbnailUrl').exec()
        } else {
            user = await UserModel.findById(user_id).select({ password: 0 }).exec()
        }

        res.json(user)

    })

    app.put("/api/user/update/", async (req, res) => {

        let body = req.body
        if (!body.user_id || !body.password) {
            res.status(400).send('Bad request')
            return;
        }


        let UserModel = getModel('Users', UserSchema);
        UserModel.findById(body.user_id, async (err, doc) => {
            if (err) console.log(err);

            let truth = bcrypt.compareSync(body.password, doc.password)
            if (!truth) {
                res.status(401).send("wrong password")
                return
            }
            doc.username = body.username || doc.username
            doc.email = body.email || doc.email
            doc.photoUrl = body.photoUrl || doc.photoUrl
            doc.thumbnailUrl = body.thumbnailUrl || doc.thumbnailUrl
            let result = await doc.save()
            res.json(result)


        })



    })

    app.post('/api/user/signup', async (req, res) => {


        let body = req.body;
        if (!body.username || !body.email || !body.password || !body.birth) {
            res.status(400).send('Bad Request')
            return;
        }

        let UserModel = getModel('Users', UserSchema);
        UserModel.findOne({ email: body.email }, (err, doc) => {
            if (err) console.log(err);
            if (doc) {
                res.status(406).json({ type: "email", message: "email already exist" })
                return
            }

            UserModel.findOne({ username: body.username }, async (err, doc) => {
                if (err) console.log(err);
                if (doc) {
                    res.status(406).json({ type: "username", message: "username already exist" })
                    return
                }

                body.password = getHash(body.password, 10)
                body.birth = new Date(body.birth)
                body.joinDate = new Date()
                body.profilePic = "";

                let userDocument = new UserModel(body)
                let saved_doc = await userDocument.save()
                res.json(saved_doc)


            })

        })


    })

}