---
layout: default
title: Rhythm Game
splash: /assets/rhythm/gameplay.png
parent: Portfolio
nav_order: 85
---

# Godot Rhythm Game

The game is played by either your left or right hand (configurable in the options menu) on the A, W, E, R and Space keys (other keys for other hand) and pressing the correct key at the correct time as determined by the falling notes. The notes align to the melody of the current song. The closer you hit the key to the start of the note, the more points you will receive. You can select a song via the screen to the right of the playing screen. You can spend your points in a shop to the left of the playing screen.

## Gameplay

<video controls autoplay muted loop>
	<source src="/assets/rhythm/gameplay.mp4" type="video/mp4">
</video>

The game is programmed in GDscript using the Godot game engine. The songs that can be selected are read from a folder on the disk and played dynamically (i.e., the game does not need to be rebuilt with new songs, the files need only to be added to the appropriate folder.) The note files themselves are written in JSON format. This file also contains information relating to the track such as BPM, artist/author, etc...

### Movement

<video controls autoplay muted loop>
	<source src="/assets/rhythm/movement.mp4" type="video/mp4">
</video>

## Audio

Used as one of the tracks in the actual game.

<audio controls>
	<source src="/assets/rhythm/music/startup.ogg">
</audio>

Music for the title screen. It also loops seamlessly.

<audio controls>
	<source src="/assets/rhythm/music/night.ogg">
</audio>

### Sound Effects

Footstep:

<audio controls>
	<source src="/assets/rhythm/sfx/footstep.ogg">
</audio>

Menu Move:

<audio controls>
	<source src="/assets/rhythm/sfx/select.ogg">
</audio>

Menu Select:

<audio controls>
	<source src="/assets/rhythm/sfx/selected.ogg">
</audio>

Stairs:

<audio controls>
	<source src="/assets/rhythm/sfx/stairs.ogg">
</audio>

Wind:

<audio controls>
	<source src="/assets/rhythm/sfx/wind.ogg">
</audio>

## Note Files using JSON

Notefiles are stored as JSON files that are parsed by the game. Each file is composed of a "meta" section, which stores metadata about the track, and a "notes" sections, which stores the actual note data for the track.

```json
{
	"meta":{
		"title":"120 Click Test",
		"bpm":120,
		"beatsperbar":4,
		"author":"Test",
		"path":"res://Music/120clicktest.ogg",
		"instshoulduse":false,
		"instpath":"",
		"previewtime":0
	},
	"notes":[
		{
			"start":0,
			"length":"1/4",
			"channel":1
		},
		{
			"start":"1/2",
			"length":"1/4",
			"channel":1
		},
		{
			"start":"1",
			"length":"1/4",
			"channel":1
		},
	]
}
```

Each note is its own object and must be listed in chronological order.

### Meta

| Key Name | Description |
| --- | --- |
| title | The title of the track. | 
| bpm | Used for calculating when to spawn notes and note spawn speed. Also displayed to the user in the song selection list. | 
| beatsperbar | Used for time signatures. | 
| author | The composer/artist of the track. | 
| path | Used to locate the audio of the track. | 
| instshoulduse | Specifies whether to use an instrument when the player plays notes. | 
| instpath | The instruments path if it is being used. | 
| previewtime | The time that the song preview should start while browsing the song list. | 

### Notes

| Key Name | Description |
| --- | --- |
| start | When the note should start. Based of the BPM of the track. May be represented as a number (integer) or as a string. Values in a string will be summed to get the final value. The allows for easier inputting. For example, instead of beat "12.0625" (beat 12 and a 1/16th note), you can use "12 1/16" or even "4 4 4 1/16". |
| length | How long the note should be displayed for. Same input style as the start field. |
| channel | Which channel should the note be played on with channel 1 being the left and 5 being the right. |

## Gallery

![](/assets/rhythm/options.png)

*The options menu lets you change between left- or right-handed controls and adjust the volume.*

![](/assets/rhythm/market.png)

*The market shows items that can be purchased.*

![](/assets/rhythm/gameplay.png)

*Gameplay screenshot showing the multipliers and combos.*

![](/assets/rhythm/original_background.png)

*The original background for the game using a different colour scheme.*

![](/assets/rhythm/palette.png)

*Colour palette used is ["Sandwich 6 Ramps Palette"](https://lospec.com/palette-list/sandwich-6-ramps) from user Space Sandwich.*

![](/assets/rhythm/player.png)

*The sprite sheet for the player includes some unused animations for running, interacting, and interacting whilst moving.*

### Selection of Development Sprites

Below, I have included a selection of sprites using in development of the game that I created myself.

The game uses a resolution of 160 x 140 pixels, the same as the Nintendo Game Boy, and as such some of the early sprites and backgrounds use the ["Nostalgia"](https://lospec.com/palette-list/nostalgia) colour palette which is designed to emulate the look of the Game Boy.

![](/assets/rhythm/misc_sprites/balloon.png)

![](/assets/rhythm/misc_sprites/bg.png)

![](/assets/rhythm/misc_sprites/balloon.png)

![](/assets/rhythm/misc_sprites/bg.png)

![](/assets/rhythm/misc_sprites/bg_back.png)

![](/assets/rhythm/misc_sprites/bg_front.png)

![](/assets/rhythm/misc_sprites/bg_mid.png)

![](/assets/rhythm/misc_sprites/bird.png)

![](/assets/rhythm/misc_sprites/board.png)

![](/assets/rhythm/misc_sprites/bottom.png)

![](/assets/rhythm/misc_sprites/bottom_color.png)

![](/assets/rhythm/misc_sprites/cursor.png)

![](/assets/rhythm/misc_sprites/earth_sphere.png)

![](/assets/rhythm/misc_sprites/earth_sphere_blank.png)

![](/assets/rhythm/misc_sprites/earth_sphere_color.png)

![](/assets/rhythm/misc_sprites/hills_bottom.png)

![](/assets/rhythm/misc_sprites/item_multi.png)

![](/assets/rhythm/misc_sprites/moon.png)

![](/assets/rhythm/misc_sprites/moon_large.png)

![](/assets/rhythm/misc_sprites/notes.png)

![](/assets/rhythm/misc_sprites/notes_color.png)

![](/assets/rhythm/misc_sprites/record.png)

![](/assets/rhythm/misc_sprites/record_color.png)

![](/assets/rhythm/misc_sprites/side_stars.png)

![](/assets/rhythm/misc_sprites/spark.png)

![](/assets/rhythm/misc_sprites/star.png)

![](/assets/rhythm/misc_sprites/stars_and_moon.png)

## Font

I created a custom font for the game's UI. I created two font weights to provide variety in the UI elements. The font was created using an online tool called [BitFontMaker2](https://www.pentacom.jp/pentacom/bitfontmaker2/).

![](/assets/rhythm/fonts/fonts.png)

[Download Thin](/assets/rhythm/fonts/tretertertertert-thin.ttf)

[Download Medium](/assets/rhythm/fonts/tretertertertert.ttf)