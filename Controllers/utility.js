const { getVideoInfo } = require('../utilities/embed_utils')

module.exports = (app) => {

    app.get("/api/utils/videoInfo/:id", async (req, res) => {

        let id = req.params.id
        if (!id) {
            res.status(400).send("Bad request");
            return
        }
        let info = await getVideoInfo(id)
        if(info){
            res.json(info)
        }else{
            res.status(404).send("video id not found")
        }
    })
}