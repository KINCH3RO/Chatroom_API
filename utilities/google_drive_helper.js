const fs = require('fs');
require('dotenv').config()
const { google } = require('googleapis');
const { Readable } = require('stream');





const oauth2client = new google.auth.OAuth2(
    process.env.client_id,
    process.env.client_secret,
    process.env.redirect_uri

)

let drive = google.drive({
    version: 'v3',
    auth: oauth2client,

})


checkIfTokenExist()
function checkIfTokenExist() {
    fs.readFile(process.cwd() + "/token.json", { encoding: 'utf-8' }, (err, data) => {
        if (err) return
     
        oauth2client.setCredentials(JSON.parse(data));
     
        console.log("google api authorized");
    })
}



module.exports.authorizeGoogleApi = function authorizeGoogleApi(code) {
    oauth2client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        if (token) {
            fs.writeFileSync(process.cwd() + "/token.json", JSON.stringify(token))
            oauth2client.setCredentials(token);
        }



    })
}

module.exports.generateUrl = function generateAuthUrl() {

    let oauthUrl = oauth2client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive'],

    })
    return oauthUrl
}









// oauth2client.setCredentials({ access_token: process.env.access_token, refresh_token: process.env.refresh_token })

module.exports.uploadFile = async function (name, mimeType, buffer, folderId = "1WqhCAZ6fWNOdTaowkDs0wc7giaZH39Dk", w = 520) {

    const readableStream = new Readable()

    readableStream.push(buffer)
    readableStream.push(null)
    var fileMetadata = {
        'name': name,
        parents: [folderId]

    };
    var media = {
        mimeType: mimeType,
        body: readableStream
    };
    let response = await drive.files.create({

        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink,webContentLink,id,thumbnailLink,hasThumbnail'

    });

    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        },

    })


    response.data.thumbnailLink = `https://drive.google.com/thumbnail?authuser=0&sz=w${w}&id=${response.data.id}`
    // response.data.thumbnailLink =`https://lh3.googleusercontent.com/d/${response.data.id}=w${w}?authuser=0`
    return response.data;

}


module.exports.folderType = {
    Default_Users_icons: "1ZjuJz_xIANhnZ9d42bz7PoY3Bq0x3s1T",
    Default_chat_Rooms_icons: "1dY_5O3NEGDm0-EJtUCyJ_KA31OfRC5jd",
    Custom_chat_Rooms_icons: "1L__mN7a5e_4YQzdC9wMbmVsgnyYAuEbw",
    Custom_users_icons: "18CjdtpFOAKo2FHy3K8NXOz3ZTZZd9LXT"
}




