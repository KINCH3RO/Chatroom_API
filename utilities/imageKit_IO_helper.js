require('dotenv').config()
const ImageKit = require("imagekit");





const imagekit = new ImageKit({

    publicKey: process.env.imageKitPublicKey,

    privateKey: process.env.imageKitPrivateKey,

    urlEndpoint: process.env.imageKitEndPoint

});

function getFileType(mimeType) {
 
    return mimeType.split('/')[0] == "image"
     || mimeType.split('/')[0] == 'audio' 
     || mimeType.split('/')[0] == 'video'
      ? mimeType.split('/')[0] : 'file'
}

module.exports.uploadFile = async function uploadFile(name, mimeType, buffer, w = 520) {

    let folderName = ""
    switch (getFileType(mimeType)) {
        case 'image': folderName = "Images"; break;
        case 'audio': folderName = "Audio"; break;
        case 'video': folderName = "Videos"; break;

        default: folderName = "Files"
            break;
    }

    console.log("uploading to :"+folderName);

    try {
        response = await imagekit.upload({
            file: buffer, //required
            fileName: name,
            folder: folderName,

        })

        let thumbnailValue = response.fileType != 'non-image' ? response.url.replace(response.name, "") + 'tr:w-400/' + response.name : '';

        console.log(thumbnailValue);
        return {
            webViewLink: response.url,
            webContentLink: response.url,
            id: response.fileId,
            thumbnailLink: thumbnailValue,
            hasThumbnail: response.fileType == 'non-image'
        }


    } catch (error) {
        throw error
      
    }

}



