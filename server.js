require('dotenv').config()
const express = require('express');
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const fileUpload = require('express-fileupload');
const mainController = require('./Controllers/MainController')
const cors = require('cors')
const app = express()
const http = require('http').Server(app)
const io = require("socket.io")(http, { cors: { origin: process.env.ORIGIN, methods: ["GET", "POST"] } });

var corsOptions = {
  origin: process.env.ORIGIN,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(bodyparser.json())
app.use(cors(corsOptions))
app.use(fileUpload())
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log("connected succesfully");

  app.get('/', (req, res) => {
    res.send('server running')
  })
  mainController(app, io)
});





const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
  console.log("Your App is listening to Port :" + PORT);
})