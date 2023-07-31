const ytdl = require('ytdl-core')

const TEST_LINK = "https://www.youtube.com/watch?v=70pPsOokZfs"

var startTime = Date.now()

ytdl.getInfo(TEST_LINK).then(info => {
	console.log(Object.keys(info.videoDetails))
	console.log(`Took ${(Date.now() - startTime)/1000} seconds`)
})