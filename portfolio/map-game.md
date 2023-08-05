---
layout: default
title: Grand Strategy Game
splash: /assets/mgo/map.png
parent: Portfolio
nav_order: 93
---

# Godot Grand Strategy Game

<video controls autoplay muted loop>
	<source src="/assets/mgo/demo.mp4" type="video/mp4">
</video>

## Key Features

- Map generated at runtime from files on disk.
- Build factories and produce equipment.
- Multiple game speeds.
- Per country action system.
- Movement of units using Dijkstra's algorithm.
  - Units cannot move into areas that they do not have access to (neutral countries)
  - Units can move via ocean only from ports.
- Dynamic placement of country name labels.
- Occupation of enemy countries.

## Screenshots

![](/assets/mgo/map.png)

*Zoomed-in map, displaying state and locale subdivisions.*

![](/assets/mgo/europe.png)

*Full map of now.*

![](/assets/mgo/factories.png)

*Manufacturing menu where factories can be assigned to production. Note the 6 factories visible in locales on the map. UK units can also be seen positioned along the south coast.*

![](/assets/mgo/equipment.png)

*The equipment menu displaying the current equipment a country has produced. A locale has also been selected on the map, demonstrating the selection effects.*

## Generating the Map

The game uses a hierarchy system where the minimum land division is a "locale", which is part of a bigger "state", which is part of a "country".

Each time the game is run, it reads the current `world.png` file and associated `world.json` file. The `world.png` contains the map of the game, with each locale a different colour. The game uses multi-threading to turn chunks of colour in the map image into [2D meshes](https://docs.godotengine.org/en/stable/tutorials/2d/2d_meshes.html) and a `Line2D` for the outline of the locale.

![](/assets/mgo/world.png)

*The world.png used to generate the game map.*

The game also contains an "editor" mode that allows for easy editing of the `world.json` without having to manually edit the file. The editor mode saves the file as a copy as it is being worked on and the changes can be made permanent by copying and choosing to replace the original `world.json` file.
My current workflow for adding new states and locales is to edit the map image externally, and then launch the game in the "editor" mode to select, assign and create new states as appropriate.

### World JSON

The `world.json` file contains three main sections. First, the `cityNames` section defines cities and towns that appear on certain locales. The keys are the RGB hex codes for locale colours of the map image. The values are an array containing the string that is the name of the city.

```json
{
	"4f460a": [
		"London"
	],
	"433c09": [
		"Croydon"
	],
	"60560c": [
		"Romford"
	]
}
```

If a city/town is a port, then the value `true` can be added to the array to signify this.

```json
{
	"cd05b0": [
		"Brighton",
		true
	],
}
```

The second sections is the `states` section, where locales are grouped into states. The state's key is it's internal name, and each state contains a capital locale.

```json
{
	"london": {
		"locales": [
			"312b02",
			"433c09",
			"51490e",
			"4f460a",
			"60560c",
			"63580f"
		],
		"commonName": "Greater London",
		"capital": "4f460a"
	}
}
```

The final section is the `country` section that defines countries as an array of states. A capital state is also defined as the country's capital. This is also where actions are defined.
It is worth noting that the ocean is technically just a country that is handled differently by the game and is included in this section.

```json
{
	"unitedkingdom": {
		"states": [
			"london",
			"surrey",
			...
			"hertfordshire",
			"tyneandwear"
		],
		"commonName": "United Kingdom",
		"color": "b43563",
		"capital": "london",
		"actions": {
			...
		}
	}
}
```

## Actions

Each country has actions that provided rewards upon completion.
Actions form a branching tree where previous actions or other requirements (`prereq`) need to be completed before the action can be started. Actions take time to complete and sometimes require a price to begin. The process of constructing factories is implemented as an action which costs currency and rewards a factory on completion. Actions have progress bars to track the progression in the appropriate UI menu.

```json
{
	"actions": {
		"testact1": {
			"name": "UK Test Action 1",
			"price": 10,
			"length": 7,
			"prereq": {

			},
			"complete": {
				"add_currency": 120
			}
		},
		"testact2": {
			"name": "UK Test Action 2",
			"price": 0,
			"length": 100,
			"prereq": {
				"has_completed_action": "testact1"
			},
			"complete": {
				"build_factories_in_random_locale_capital": 1,
				"add_currency": 10
			}
		}
	}
}
```

The keys in `prereq` and `complete` are looked up in a string to function dictionary to check whether the requirement is satisfied or to give rewards upon completion.