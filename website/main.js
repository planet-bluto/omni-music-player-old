const print = console.log
var socket = io()
var input = document.getElementById('song')
var playhead = document.getElementById('playhead')
var pause_button = document.getElementById('pause')
var playhead_down = false

var PlayingSong = null
var cache = []

const TEST_PLAYLIST = [
	"https://soundcloud.com/qteku/bimo",
	"https://soundcloud.com/qteku/rat-trap",
	"https://soundcloud.com/yunibasaruwa/cant-tell",
	"https://idogedochiptune.bandcamp.com/track/temporal-memories",
	"https://idogedochiptune.bandcamp.com/track/apple-cinnamon-porridge",
	"https://memodemo.bandcamp.com/track/its-like-that",
	"https://youtu.be/Lhjh-rD8Bwc?list=PL61Jej2wKUEQiarJ1JWJ5Y1fYM3CEIUAs",
	"https://www.youtube.com/watch?v=anw6cFmR9hM&list=PL61Jej2wKUEQiarJ1JWJ5Y1fYM3CEIUAs&index=5&pp=gAQBiAQB8AUB",
	"https://www.youtube.com/watch?v=75kJb_aAvKY&list=PL61Jej2wKUEQiarJ1JWJ5Y1fYM3CEIUAs&index=8&pp=gAQBiAQB8AUB",
]


function play( url ) {
	if (PlayingSong != null) {
		PlayingSong.currentStream.pause()
		clearInterval(PlayingSong.playhead_int)
	}

	var playhead_int = setInterval(() => {
		if (PlayingSong != null) {
			var new_val = (PlayingSong.currentStream.currentTime / PlayingSong.streams.mid.duration)*100
			// print(new_val)
			if (!playhead_down) { playhead.value = new_val }
		}
	}, 100)

	PlayingSong = {
		"streams": {
			"start": stream(url, true),
			"mid": stream(url, false)
		},
		"buffered": false,
		"playhead_int": playhead_int,
		"paused": false
	}

	Object.defineProperty(PlayingSong, "currentStream", {
		get() {
			return PlayingSong.streams[(PlayingSong.buffered ? "mid" : "start")]
		},
	})

	// PlayingSong.streams.start.addEventListener("progress", e => {
	// 	var this_stream = PlayingSong.streams.start
	// 	if (!PlayingSong.buffered) {
	// 		playhead.value = (this_stream.currentTime / PlayingSong.streams.mid.duration)*100
	// 	}
	// })

	// PlayingSong.streams.mid.addEventListener("progress", e => {
	// 	var this_stream = PlayingSong.streams.mid
	// 	if (PlayingSong.buffered) {
	// 		print(`current: ${this_stream.currentTime} | total: ${PlayingSong.streams.mid.duration}`)
	// 		playhead.value = (this_stream.currentTime / PlayingSong.streams.mid.duration)*100
	// 	}
	// })

	PlayingSong.streams.mid.addEventListener("loadeddata", e => {
		print(`Loaded! < ${url} >`)
		PlayingSong.buffered = true
		PlayingSong.streams.start.pause()
		PlayingSong.streams.mid.currentTime = PlayingSong.streams.start.currentTime
		PlayingSong.streams.mid.play()
		// setTimeout(() => {
			
		// }, 1)
	})

	PlayingSong.streams.start.play()
}

TEST_PLAYLIST.forEach(link => {
	var button = document.createElement("button")
	button.textContent = link
	button.onclick = e => {
		play( link )
	}
	document.body.appendChild(button)
})

input.addEventListener("keydown", e => {
	print(e.which)
	if (e.which == 13) {
		e.preventDefault()
		play( input.value )
		input.value = ""
		// var new_src = `http://localhost:8080/media?url=${encodeURIComponent(input.value)}`
		// var new_audio = new Audio(new_src)
		// new_audio.setAttribute("controls", "")
		// new_audio.setAttribute("autoplay", "")
		// document.body.appendChild(new_audio)
	}
})

function updateTime() {
	print(playhead.value)
	if (PlayingSong != null) {
		print((playhead.value/100)*PlayingSong.streams.mid.duration)
		PlayingSong.currentStream.currentTime = ((playhead.value/100)*PlayingSong.streams.mid.duration)
		// PlayingSong.currentStream.fastSeek((playhead.value/100)*PlayingSong.streams.mid.duration)
	}
}

playhead.addEventListener("input", e => { updateTime() })
playhead.addEventListener("change", e => { updateTime() })

playhead.addEventListener("mousedown", e => { playhead_down = true })
playhead.addEventListener("mouseup", e => { playhead_down = false })

pause_button.onclick = (async e => {
	if (PlayingSong.paused) {
		PlayingSong.paused = false
		print("Ok??")
		await PlayingSong.currentStream.play()
		print("Thas what I thought")
		pause_button.textContent = "⏸"
	} else {
		PlayingSong.paused = true
		PlayingSong.currentStream.pause()
		pause_button.textContent = "▶"
	}
})

function stream( url, start = false ) {
	if (start) {
		var elem = new Audio(`/mediastart?url=${encodeURIComponent(url)}`)
		elem
		return elem
	} else {
		var elem = new Audio(`/media?url=${encodeURIComponent(url)}`)
		elem
		return elem
	}
}
