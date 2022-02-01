const ytdl = require('ytdl-core')





module.exports.getVideoInfo = async (id) =>{
    try {
        let info = await ytdl.getInfo(id,{downloadURL:true})
        
        return {
            title:info.videoDetails.title,
            channel:info.videoDetails.author.name
        }
    } catch (error) {
        return null
    }
}
 
    
