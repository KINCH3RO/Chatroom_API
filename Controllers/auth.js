
const bcrypt = require('bcrypt')
const { generateToken, authenticateToken, verifyToken } = require('../utilities/jwt_utils')
const { UserSchema, getModel } = require('../Schemas/Schemas')





module.exports = (app) => {
    //token auth middleware
    app.use(authenticateToken)

    app.post('/api/auth/login', (req, res) => {

        let body = req.body
        if (!body.email || !body.password) {
            res.status(400).send('Bad Request')
            return
        }

        let UserModel = getModel('Users', UserSchema)
        UserModel.findOne({ email: body.email }, (err, doc) => {
            if (err) console.log(err);
            if (doc) {
                if (bcrypt.compareSync(body.password, doc.password)) {
                    delete doc.password
                    let generatedToken = generateToken(JSON.parse(JSON.stringify(doc)))
                    res.json({ token: generatedToken })
                    return
                }

            }
            res.status(406).json({ type: "incorrect", message: "email or password is invalid" })
        })

    })



    app.get("/api/auth/getPayload", (req, res) => {
        try {
            const authHeader = req.headers['authorization']
            let token = authHeader.split(' ')[1]
            res.json(verifyToken(token))
        } catch (error) {
            res.status(403).json({message:'Not authorized'})
        }

    })


    app.get("/api/auth/isAuthorized", (req, res) => {
        try {
            const authHeader = req.headers['authorization']
            let token = authHeader.split(' ')[1]

            verifyToken(token)

            res.status(200).send({message:"Authorized"})
        } catch (error) {
            res.status(403).send({message: "Not Authorized"})
        }

    })
}