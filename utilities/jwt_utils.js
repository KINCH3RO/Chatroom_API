const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
var jwt = require('jsonwebtoken');

expireTime = 30 * 24 * 60 * 60;



function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expireTime, algorithm: 'HS256' })
}

function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)

}


no_auth_paths = ["/api/auth/login", "/api/user/signup", "/api/auth/login/", "/api/user/signup/"]
function authenticateToken(req, res, next) {

    if (no_auth_paths.includes(req.path)) {
        next()
        return;
    }
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        res.status(400).send("Authorization header not specified")
        return;
    }
    
    if (authHeader.slice(0, 6) != "Bearer") {
        res.status(400).send("Bearer tag not specified")
        return;
    }

    let token = authHeader.split(' ')[1]
    if (!token) {
        res.status(400).send("token not specified after Bearer")
        return;
    }

    
    try {
        payload = verifyToken(token)
        req.headers['user_id']=payload._id
        next()
        
    } catch (error) {
        res.status(401).send(error)
    }
   


}

module.exports = {
    generateToken,
    authenticateToken,
    verifyToken
}

