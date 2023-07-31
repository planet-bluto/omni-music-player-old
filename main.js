// We need to find a way to manipulate streams betterrr

global.print = console.log

const path = require('path')
var fs = require('fs')
const { Readable } = require('node:stream')
const { SoundCloud } = require("scdl-core")
const ytdl = require('ytdl-core')
const bcfetch = require('bandcamp-fetch')
var fetch = require('node-fetch')
const streamToBuffer = require('fast-stream-to-buffer')
// Server //
const express = require('express')
const app = express()
const httpserver = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(httpserver, {
  maxHttpBufferSize: 100e6
});

app.use('/', express.static(path.join(__dirname, 'website')))

async function getStream( thisURL, req_range ) {
  var thisURLClass = new URL(thisURL)
  var stream;

  var range = req_range
  var start = 0
  var end = 0
  if (req_range) {
    var parts = range.replace(/bytes=/, "").split("-")
    var partialstart = parts[0]
    var partialend = parts[1]
    start = parseInt(partialstart, 10)
    end = parseInt(partialend, 10)
  }
  
  const SOUNDCLOUD_HOSTNAMES = ["soundcloud.com"]
  const YOUTUBE_HOSTNAMES = ["www.youtube.com", "youtu.be", "youtube.com"]

  var song_length = 1000
  var mode = null
  if (SOUNDCLOUD_HOSTNAMES.includes(thisURLClass.hostname)) { mode = "SC"; stream = await SoundCloud.download(thisURL, {highWaterMark: 1 << 25}) }
  if (YOUTUBE_HOSTNAMES.includes(thisURLClass.hostname)) {
    mode = "YT"
    stream = ytdl(thisURL, { filter: "audioonly", range: {start: start, end: end}})
  }
  if (thisURLClass.hostname.endsWith("bandcamp.com")) {
    mode = "BC"
    var track = await bcfetch.getTrackInfo(thisURL)
    // var response = await fetch(track.streamUrl, {method: "GET"})
    // stream = response.body
    stream = track.streamUrl
  }

  return {stream: stream, mode: mode, start: start, end: end}
}

app.get("/mediastart", async (req, res) => {
  var thisURL = req.query.url
  if (thisURL != "") {
    var {stream, mode, start, end} = await getStream(thisURL, req.headers.range)
    switch (mode) {
      case "BC":
        res.redirect(stream)
      break;
      default:
        stream.pipe(res)  
    }
    
  }
})

app.get("/media", async (req, res) => {
  var thisURL = req.query.url
  if (thisURL != "") {
    var {stream, mode, start, end} = await getStream(thisURL, req.headers.range)

    // res.set('Content-Type', 'audio/wav')
    // res.writeHead(200, { 'Content-Length': song_length, 'Content-Type': 'audio/mpeg' })  
    // stream.pipe(res)

    switch (mode) {
      case "YT":
        stream.pipe(res)
      break;
      case "BC":
        res.redirect(stream)
      break;
      default:
        streamToBuffer(stream, (err, buf) => {
          var total = buf.length

          end = end ? parseInt(end, 10) : total-1
          var chunksize = (end-start)+1
          // var readStream = fs.createReadStream(buf, {start: start, end: end})
          var readStream = Readable.from(buf.subarray(start, end))
          res.writeHead(206, {
              'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
              'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
              'Content-Type': 'audio/mpeg'
          });
          readStream.pipe(res)
        })
    }
  }
})

app.get("/", (req, res) => {
  res.sendFile('/index.html', {root: path.resolve(__dirname, "website")})
})

io.on("connection", async socket => {

})

SoundCloud.connect().then(() => {
  httpserver.listen(8080, "0.0.0.0", (e) => {
    print("Server Listening!")
  })
})