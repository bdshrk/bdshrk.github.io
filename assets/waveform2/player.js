var playText = "PLAY"
var pauseText = "PAUSE"

var colPlayed = "#ff0000"
var colPlayedHighlight = "#dd0000"
var colRemaining = "#ffffff"
var colRemainingHighlight = "#dddddd"

var dataPath = "/assets/waveform2/data.txt"

var inaudible = -60.0
var spacing = 0.5

var data = []
var rawData = []
var mousePercentX = 0.0

var canvas = document.getElementById("testcanvas")
var c2d = canvas.getContext("2d")
var audio = document.getElementById("testaudio")
var playpause = document.getElementById("testplaypause")

playpause.innerHTML = playText

canvas.width = 400
canvas.height = 100

function sendRequest(path) {
    var xhr = new XMLHttpRequest()
    xhr.onload = function() {
        rawData = this.responseText.split("\n")
        data = this.responseText.split("\n")

        animate()
    }
    xhr.open("GET", path, true)
    xhr.send()
}

sendRequest(dataPath)

canvas.addEventListener("mousedown", function(event) {
    var seekPercent = event.offsetX / canvas.width
    audio.currentTime = seekPercent * audio.duration
    if (audio.paused) {
        audio.play()
        playpause.innerHTML = pauseText
    }
})

canvas.addEventListener("mousemove", function(event) {
    mousePercentX = event.offsetX / canvas.width
})

canvas.addEventListener("mouseleave", function() {mousePercentX = 0.0})

function togglePlayback() {
    if (audio.paused) {
        audio.play()
        playpause.innerHTML = pauseText
    } else {
        audio.pause()
        playpause.innerHTML = playText
    }
}

function truncateData(maxLength) {
    if (data.length == 0) return
    data = rawData.slice(0, maxLength)
}

function animate() {
    requestAnimationFrame(animate)
    if (data.length == 0) return
    draw()
}

function changeTrack(elem) {
    sendRequest(elem.dataset.values)
    document.getElementsByClassName("selected")[0].classList.remove("selected")
    elem.classList.add("selected")
    audio.currentTime = 0.0
    playpause.innerHTML = playText
    audio.getElementsByTagName("source")[0].src = elem.dataset.src
    audio.load()
}

function draw() {
    if (!audio.duration) return
    var playedPercent = audio.currentTime / audio.duration

    c2d.clearRect(0, 0, canvas.width, canvas.height)

    for (let index = 0; index < data.length; index++) {
        var peak = Math.max(Math.min(data[index], 0.0), inaudible)
        var indexPercent = index / data.length

        if (indexPercent >= playedPercent) {
            c2d.fillStyle = colRemainingHighlight
            if (indexPercent >= mousePercentX) {
                c2d.fillStyle = colRemaining
            }
        } else {
            c2d.fillStyle = colPlayedHighlight
            if (indexPercent >= mousePercentX) {
                c2d.fillStyle = colPlayed
            }
        }
        
        c2d.fillRect(index * (canvas.width / data.length),
            (peak / inaudible) * (canvas.height / 2),
            (canvas.width / data.length) - spacing,
            Math.max((1.0 - (peak / inaudible)) * (canvas.height), 1.0)
        )
    }
}