---
layout: default
title: 3D Space Shooter
splash: /assets/space/splash5.png
parent: Portfolio
nav_order: 92
---

# 3D Arcade Space Shooter in Godot

Controls:

| Key           | Action                                                |
|---------------|-------------------------------------------------------|
| `WASD`        | Movement.                                             |
| `LEFT SHIFT`  | Boost while moving.                                   |
| `MOUSE`       | Move mouse to look around.                            |
| `LEFT MOUSE`  | Shoot (Click or hold.)                                |
| `RIGHT MOUSE` | Hold to lock. Keep held while shooting.               |
| `E`           | (Debug) Spawn `WAR A` ship (Will fight `WAR B`).      |
| `Q`           | (Debug) Spawn `WAR B` ship (Will fight `WAR A`).      |
| *Hint*        | *These ships will only fight you if you attack them!* |
| `1`           | (Debug) Spawn `ALLY` ship (Will help you fight).      |

The web version uses GLES2 rather than GLES3 that was used for development. All screenshots from this page are using GLES3. The only major differences are that post-processing filters no longer work (most noticeable in the black outline effect being absent.)

Running the game in-browser transfers only 16MB of data.

## Videos

Unmute for audio...

### Gameplay

<video controls autoplay muted loop style="width: 100%">
	<source src="/assets/space/videos/gameplay.mkv" type="video/mp4">
</video>

### Movement

<video controls autoplay muted loop style="width: 100%">
	<source src="/assets/space/videos/movement.mkv" type="video/mp4">
</video>

## The World

### Planets

The world is made up of a single simple ico-sphere shape created in Blender.
This model is good enough to represent stars, planets, and moons.
When the model is imported into Godot,
we can apply a simple, modifiable material and attach a sphere collider.

![](/assets/space/planet.png)
![](/assets/space/planet-wireframe.png)
![](/assets/space/planet-ingame.png)

We can use the following script pieces to randomise the planet:
First, we randomise the movement and appearance of the planet...

```gdscript
# Contains all colour constants
# (Provides better colours than just generation three random RGB numbers.)
const colors = [
	Color.aliceblue,
	...
	Color.yellowgreen
]

...

func _ready():
	rotation_speed = rand_range(-7.5, 7.5) * time_scale
	orbit_speed = rand_range(0.5, 1.0) * time_scale
	size = clamp(rand_range(8.0, 32.0) * physical_scale, 0, max_size)
	orbit_start_offset = rand_range(0.0, 360.0)
	color = colors[randi() % colors.size()]
	color = color.linear_interpolate(color_tint, 0.65)
	elliptical = randf()
```

Then we can apply these random values to the model:

```gdscript
$Sphere.scale = Vector3(size, size, size)
$StaticBody.scale = Vector3(size, size, size)
get_parent().rotate_y(deg2rad(orbit_start_offset))
get_parent().rotate_x(deg2rad((0.5 - sin(elliptical)) * elliptical_mult))
get_parent().rotate_z(deg2rad((0.5 - cos(elliptical)) * elliptical_mult))
get_node("Sphere/Icosphere").set_surface_material(0, get_node("Sphere/Icosphere").get_surface_material(0).duplicate())
get_node("Sphere/Icosphere").get_surface_material(0).albedo_color = color
```

We can then randomise and generate moons for the planet. Moons are technically small planets that orbit planets rather than stars, so we can just duplicate the current planet and modify its values to create a moon. This has the added benefit of larger planets having bigger moons, and smaller planets having smaller moons. We can adjust the `color_tint` value to make the moons have a similar colour to the planet that they orbit.

```gdscript
var moon_count
var moons = []
var is_moon = false

...

moon_count = 0
if not is_moon:
	moon_count = randi() % 2

for moon in range(moon_count):
	var moon_inst = self.duplicate()
	moons.append(moon_inst)
	moon_inst.is_moon = true
	moon_inst.physical_scale = 0.5
	moon_inst.time_scale = 0.15
	moon_inst.max_size = size * 0.5
	moon_inst.color_tint = color
	moon_inst.transform.origin.x = rand_range(size*2.5, size*4)
	var orbit_isnt = Position3D.new()
	add_child(orbit_isnt)
	orbit_isnt.add_child(moon_inst)
```

Now all that's left is to make the planet follow its orbit and rotate around a certain point. As all planet objects are children of a star, we can achieve this orbiting effect by simply rotating the parent star and by the orbit speed, and then "un-rotating" the planet to ensure we keep only the position of child planet when rotating the parent.

```gdscript
func _process(delta):
	get_parent().rotate_y(orbit_speed * delta)
	rotate_y((-orbit_speed + rotation_speed) * delta)
```

### Stars

Stars use the same model as planets. They are static and do not rotate, nor can they have different colours and have no scripts attached.

![](/assets/space/star.png)
![](/assets/space/star-nodes.png)

### Drawing Orbit Path

Orbit paths are created using [Polyliner](https://godotengine.org/asset-library/asset/1313){:target="\_blank"} from the Godot Asset Library. This allows 3D lines to be created in Godot.

![](/assets/space/orbit.png)

To create the orbit, we simply create a circle using a `Curve3D` and make it the Polyliner curve. The size, scale and rotation of the orbit is determined by its parent and the scale of the orbit as defined by the parent planet.

```gdscript
var curve_new = Curve3D.new()
var size = 20

func _ready():
	curve_new.add_point(Vector3(1,0,0) * size, Vector3.ZERO, Vector3(0,0,0.55) * size)
	curve_new.add_point(Vector3(0,0,1) * size, Vector3(0.55,0,0) * size, Vector3(-0.55, 0, 0) * size)
	curve_new.add_point(Vector3(-1,0,0) * size, Vector3(0, 0, 0.55) * size, Vector3(0,0,-0.55) * size)
	curve_new.add_point(Vector3(0,0,-1) * size, Vector3(-0.55,0,0) * size, Vector3(0.55, 0, 0) * size)
	curve_new.add_point(Vector3(1,0,0) * size, Vector3(0,0,-0.55) * size, Vector3.ZERO)

	$LinePath3D.curve = curve_new
```

We can then set the colour and material values to what we wish.

```gdscript
$LinePath3D.material.set_shader_param("color", Color.lightblue)
$LinePath3D.material.set_shader_param("specular", 0)
$LinePath3D.material.set_shader_param("roughness", 1)
```

### System Generator

The main level scene includes a `World.gd` script that handles the random creation of the star system. The level is generated when the scene loads.
First, the total number of planets to be generated is decided (at least 1).

```gdscript
const MAX_PLANETS = 10

var planet_count
var rolling_distance

func _ready():
	randomize()
	rolling_distance = 100
	planet_count = (randi() % MAX_PLANETS) + 1
	print("Total Planets: " + str(planet_count))
```

Then, each planet's instance and its orbit location are created and the distance of the orbit is set.

```gdscript
const PLANET_SCENE = preload("res://PlanetScene.tscn")

...

for planet in range(planet_count):
	var planet_inst = PLANET_SCENE.instance()
	var orbit_inst = Position3D.new()

	planet_inst.transform.origin.x = rolling_distance

	add_child(orbit_inst)
	orbit_inst.add_child(planet_inst)
```

Next, we can compute how much we need to add to the `rolling_distance` variable so the planets and moons don't collide with each-other.

```gdscript
var max_moon_dist = 0.0
for moon in planet_inst.moons:
	if moon.transform.origin.x > max_moon_dist:
		max_moon_dist = moon.transform.origin.x

planet_inst.transform.origin.x += max_moon_dist

rolling_distance += rand_range(15.0, 50.0) + (planet * 25.0) + (planet_inst.size * 2) + max_moon_dist
```

Then, we tell the planet to draw its orbit:

```gdscript
planet_inst.draw_orbit()
```

Within the script attached to each planet instance, there is a `draw_orbit()` method
that can be used to recursively draw the orbit indicators for each planet and its moons.
This works because moon is technically just a smaller planet that orbits a planet rather than a star.

```gdscript
const ORBIT_INDICATOR_SCENE = preload("res://OrbitIndicator.tscn")

func draw_orbit():
	var orbit_indicator_inst = ORBIT_INDICATOR_SCENE.instance()
	orbit_indicator_inst.size = transform.origin.x
	get_parent().add_child(orbit_indicator_inst)

	for moon in moons:
		moon.draw_orbit()
```

![](/assets/space/space.png)

## The UI

### Static

#### HUD

The static HUD includes health and shield meters at the bottom of the screen, an overlay for the warp UI, and some information regarding weapons and targeting in the centre of the screen. Also shown is an FPS counter in the top-right corner.

![](/assets/space/ui.png)
![](/assets/space/ui-nodes.png)

A crosshair and a hit-marker image are positioned in the centre of the screen. The hit-marker image will flash when the player damages an enemy. A vertical bar can also be seen to the right of the crosshair. This is the targeting meter, and shows the lock-on progress for the currently targeted enemy.

#### Scripts

The centre-screen based information is handled by the `CenterInfo.gd` script. To handle hit-markers, every time an enemy ship is hit, the `display_hitmarker()` function below is called where the hit-marker is made visible. Every frame, the hit-marker's alpha component is moved back towards 0 (invisible) to achieve a smooth fadeout effect.

```gdscript
func _ready():
	$Hitmarker.modulate.a = 0

func _process():
	$Hitmarker.modulate.a = lerp(clamp($Hitmarker.modulate.a - 0.025, 0, 1), 0, 1.0 * delta)
	...

func display_hitmarker():
	$Hitmarker.modulate.a = 1
```

If the player is currently attempting to lock-on to an enemy, the UI will move towards the final lock-on point. This gives the impression that the ship is actually locking-on the the other ship. This is handled via the following code where `target_position_screen` refers to the lock-on point.

```gdscript
func _process(delta):
	...
	if target_position_screen != null:
		if not force_to_target:
			var distance = rect_position.distance_to(target_position_screen)
			self.rect_position = rect_position.move_toward(target_position_screen, 10.0 / target_move_time_total * delta * distance)
		else:
			self.rect_position = target_position_screen
	else:
		self.rect_position = get_viewport().size / 2
```

When the lock-on has finished and was successful, the following function is called that ensure the crosshair is now positioned _exactly_ on the lock-on point. See the above code for the effects of setting `force_to_target` to `true`.

```gdscript
func force_to_target():
	force_to_target = true
```

To set the `target_position_screen`, the following method is called. It translates a given world position (a `Vector3`) into a position on the screen that can be used for moving the UI (a `Vector2`.) It also allows a time to be given that effects the speed of the crosshair tracking.

```gdscript
func set_target_screen_position(world_pos, time_to_move):
	force_to_target = false
	if world_pos:
		target_position_screen = get_viewport().get_camera().unproject_position(world_pos)
	else:
		target_position_screen = null
	target_move_time_total = time_to_move
```

The centre script also provides functions for setting the current targeting values:

```gdscript
func set_targeting_text(text):
	$Crosshair/TargetingMessage.text = text

func set_targeting_bar(val, max_val):
	$TargetingBar.max_value = max_val
	$TargetingBar.value = val
```

Another script called `HealthAndShield.gd` controls the values of the static HUD elements...

```gdscript
func _ready():
	$ShieldBar.modulate = Color.cyan

func update_values(player):
	$HealthBar.max_value = player.max_health
	$HealthBar.value = player.current_health
	$ShieldBar.max_value = player.max_shield
	$ShieldBar.value = player.current_shield
```

#### Multi-purpose Alerts

I created a multi-purpose alert system for displaying important information to the player. For example, it is used when the player's shields go down.

![](/assets/space/alert.png)
![](/assets/space/alert-nodes.png)

Any script can call the `alert(...)` function below to create and display a new alert on the player's screen. The function makes use of the `yield` function to simplify the full fade-in and fade-out animation calls into a single function.

```gdscript
extends Control

const ALERT_SCENE = preload("res://Alert.tscn")

func alert(line1, line2, time_to_display):
	var alert = ALERT_SCENE.instance()
	alert.get_node("VBoxContainer/CenterContainer/Line1").text = line1
	alert.get_node("VBoxContainer/CenterContainer2/Line2").text = line2
	add_child(alert)
	var fadein_length = alert.get_node("AnimationPlayer").get_animation("fadein").length
	var fadeout_length = alert.get_node("AnimationPlayer").get_animation("fadeout").length
	alert.get_node("AnimationPlayer").play("fadein")
	yield(get_tree().create_timer(time_to_display + fadein_length), "timeout")
	alert.get_node("AnimationPlayer").play("fadeout")
	yield(get_tree().create_timer(fadeout_length), "timeout")
	alert.queue_free()
```

### Dynamic

The game has in-world UI, where the name, health, shield, and distance to an AI ship is shown to the player. (For debugging purposes, the current AI FSM state of the ship is also shown.) This is presented in the form of a "nameplate" that follows the ship in the in-game world.

![](/assets/space/shipinfo.png)
![](/assets/space/shipinfo-nodes.png)

The script attached to each of these nameplates is very simple, it stores a target alpha value and moves its alpha towards to target. The updating of the components of the nameplate is handled by another script we will look at next.

```gdscript
var target_alpha = 1.0

func _process(delta):
	$Fadeout.modulate.a = move_toward($Fadeout.modulate.a, target_alpha, 4.0 * delta)
```

#### Handling the Nameplates

First, we set up references to the director and the player...

```gdscript
var director
var player

func _ready():
	director = $"../../../Director"
	player = director.player
```

Then we process each ship one at a time, ignoring the player. We first check if the ship is visible on the screen. This is done by un-projecting the world position of the ship from the camera to get the position on the screen of the ship. We also check if the world position is behind the camera. If the world position is **in front** of the camera _and_ the unprojected position is **within the limits of the camera**, then the ship's nameplate should be visible.

```gdscript
func _process(delta):
	for ship in director.ships:
		if player == ship:
			continue
		var target_alpha_set = false
		var screen_pos = get_viewport().get_camera().unproject_position(ship.get_node("Model").global_transform.origin)
		var is_front_of_camera = not get_viewport().get_camera().is_position_behind(ship.get_node("Model").global_transform.origin)
		if (is_front_of_camera and
			screen_pos.x >= border_buffer and screen_pos.x <= get_viewport().size.x - border_buffer and
			screen_pos.y >= border_buffer and screen_pos.y <= get_viewport().size.y - border_buffer):
			ship.ui_elem.rect_position = screen_pos
			ship.ui_elem.visible = true
			ship.ui_elem.get_node("Indicators/ShipIndicatorArrow").hide()
			ship.ui_elem.get_node("Indicators/ShipIndicator").show()
		else:
			...
```

Alternatively, if the ship fails this check (meaning it is offscreen,) we hide the nameplate and instead show an arrow indicating where the ship is relative to the edges of the screen. This code was inspired by the Unity script presented in [this video](https://www.youtube.com/watch?v=gAQpR1GN0Os){:target="\_blank"}. The following code gets the position of the arrow on the screen (respecting a "safe-zone" around the edges.)

```gdscript
const border_buffer = 50.0

...
			...
		else:
			if not is_front_of_camera:
				screen_pos.x = get_viewport().size.x - screen_pos.x
				screen_pos.y = get_viewport().size.y - screen_pos.y

			var center_screen = get_viewport().size / 2.0
			screen_pos -= center_screen

			var angle = atan2(screen_pos.x, screen_pos.y)

			var angle_cos = cos(angle)
			var angle_sin = sin(angle)

			# Small value otherwise there is a divide by zero.
			if angle_sin == 0:
				angle_sin = 0.001

			screen_pos = center_screen + Vector2(angle_sin * 150, angle_cos * 150)
			var m = angle_cos / angle_sin

			var screen_bounds = (center_screen - (Vector2(border_buffer, border_buffer)))

			if angle_cos > 0:
				screen_pos = Vector2(screen_bounds.y/m, screen_bounds.y)
			else:
				screen_pos = Vector2(-screen_bounds.y/m, -screen_bounds.y)

			if (screen_pos.x > screen_bounds.x):
				screen_pos = Vector2(screen_bounds.x, screen_bounds.x * m)
			elif (screen_pos.x < -screen_bounds.x):
				screen_pos = Vector2(-screen_bounds.x, -screen_bounds.x * m)

			screen_pos += center_screen
```

Once we have worked out the `screen_pos` we can apply it to the ship's UI and show the arrow rather than the indicator:

```gdscript
ship.ui_elem.rect_position = screen_pos
ship.ui_elem.visible = true

ship.ui_elem.get_node("Indicators/ShipIndicatorArrow").show()
ship.ui_elem.get_node("Indicators/ShipIndicatorArrow").rect_rotation = 180 - rad2deg(angle)
ship.ui_elem.get_node("Indicators/ShipIndicator").hide()

if !target_alpha_set:
	ship.ui_elem.target_alpha = 0
	target_alpha_set = true
```

After the position has been set, we can then update the labels:

```gdscript
var dist_from_player = player.get_node("Model").global_transform.origin.distance_to(ship.get_node("Model").global_transform.origin)
ship.ui_elem.get_node("Fadeout/Distance").text = str(int(dist_from_player)) + " m"
ship.ui_elem.get_node("Fadeout/State").text = str(director.state.keys()[ship.state])
```

We can then set the `target_alpha` of the ship based on the distance from the player where closer ships will be more visible. If the ship is the one that is currently being locked-on to, then we set its alpha to 1 so its always visible. We also set the relative to the distance...

```gdscript
if !target_alpha_set:
	ship.ui_elem.target_alpha = clamp((75 / dist_from_player) - 0.25, 0.0, 0.5)
if player.current_lock == ship:
	ship.ui_elem.target_alpha = 1

var aim_dist_scale_mod = 100.0 / pow(dist_from_player, 0.8)
ship.ui_elem.get_node("Indicators").rect_scale = Vector2(aim_dist_scale_mod, aim_dist_scale_mod)
ship.ui_elem.get_node("Fadeout").rect_position.x = ((aim_dist_scale_mod) * 10.0) - 10.0
```

Then, the colour of the indicator is changed based on the relation of the ship to the player. Hostile ships are in red, neutral or allied ships are white.

```gdscript
ship.ui_elem.get_node("Indicators").modulate = Color.white
if ship.get_faction().aware_of_allies:
	if director.is_faction_hostile_to(ship.faction_str, "ALLY"):
		ship.ui_elem.get_node("Indicators").modulate = Color.red
else:
	if ship.unaware_of_allies_hostile_ships.has(player):
		ship.ui_elem.get_node("Indicators").modulate = Color.red
```

Show the aim indicator if the playing is locked-on to a ship:

```gdscript
if player.current_lock == ship and player.is_locked:
	var aim_vector = ship.get_node("HitScanBox").global_transform.origin
	var aim_pos = get_viewport().get_camera().unproject_position(aim_vector)
	var is_aim_visible = not get_viewport().get_camera().is_position_behind(aim_vector)
	ship.ui_elem.get_node("AimIndicator").rect_position = aim_pos - screen_pos
	ship.ui_elem.get_node("AimIndicator").visible = is_aim_visible
	ship.ui_elem.get_node("AimIndicator").rect_scale = Vector2(aim_dist_scale_mod, aim_dist_scale_mod)
else:
	ship.ui_elem.get_node("AimIndicator").visible = false
```

Finally, we can update the name of the ship (in this case, its faction,) and the health bar. The health bar will initially display the shield until it is depleted, when it will then show the health.

```gdscript
ship.ui_elem.get_node("Fadeout/Name").text = ship.faction_str

if ship.current_shield == 0:
	ship.ui_elem.get_node("Fadeout/HealthBar").max_value = ship.max_health
	ship.ui_elem.get_node("Fadeout/HealthBar").value = ship.current_health
	ship.ui_elem.get_node("Fadeout/HealthBar").modulate = Color.white
else:
	ship.ui_elem.get_node("Fadeout/HealthBar").max_value = ship.max_shield
	ship.ui_elem.get_node("Fadeout/HealthBar").value = ship.current_shield
	ship.ui_elem.get_node("Fadeout/HealthBar").modulate = Color.cyan
```

Putting this all together gets us the following:

![](/assets/space/dynamic-ui.png)

## The Spaceship

### Model

The model for the spaceship was created in Blender using very simple geometry.

#### Version 1

Version 1 was essentially a placeholder ship for testing the game's movement with. Making this placeholder also allowed me to correctly configure model export and import setting within Blender and Godot.

![](/assets/space/ship1.png)
![](/assets/space/ship2.png)

I modelled half the ship and used a mirror modifier to duplicate it to the other side.

![](/assets/space/ship3.png)

#### Version 2

Version 2 was a much more modifiable spaceship. Each part of the ship can now be hidden.

![](/assets/space/ship4.png)
![](/assets/space/ship5.png)
![](/assets/space/ship6.png)
![](/assets/space/ship7.png)
![](/assets/space/ship8.png)

Each part of the spaceship can be hidden. This is useful as in the game, trading spaceships won't have guns.

![](/assets/space/ship-parts.gif)

### In the Engine

All spaceship, whether player or AI controlled, use the same base. The `spaceship_2` node is the imported model from Blender.

![](/assets/space/ship-ingame.png)
![](/assets/space/ship-nodes.png)

The ship scene contains the following:

-   A camera (removed for AI.)
-   A collision shape for physical collision (mainly with stars and planets.)
-   A hitbox for emulating bullet speed in a fair way for the player (see more about this in the [hitbox adjustment](#hitbox-adjustment) section.)
-   Any number (in this case, 2) firing positions for bullets to spawn at.
-   Several timers for health and shield regeneration, etc...
-   A number of particle effects for various actions.
-   Engine SFX.

### Player Movement

For the player movement, I decided on a more accessible, arcade style. In this style, the player uses the mouse to aim their spaceship, and the `WASD` keys to move. A key difference between this movement and the movement in a more realistic game such as Frontier's [Elite Dangerous](https://en.wikipedia.org/wiki/Elite_Dangerous){:target="\_blank"} is that our movement only effects the XY rotation. In Elite Dangerous, the player is free to rotate their ship in the X, Y, and Z axis, i.e., there is no concept of a fixed "up" direction. In our movement, there is a fixed "up" direction that the player rotates around, meaning that the player can't go upside-down.

To implement this style of movement, we first need some constants and variables to store relevant information...

```gdscript
const SENSITIVITY = 30.0
const DEAD_ZONE_RADIUS = 25.0
const CAMERA_FOV_NORMAL = 65
const CAMERA_FOV_BOOST = 90
const acceleration_model = 4.5

var max_speed = 50.0
var boost_mult = 2.5
var camera_fov = 65
var movement_axis = Vector3()
var turn_acceleration = 3.5
var thrust_acceleration = 1.5
var input = Vector2.ZERO
```

Another set of variables to store two types of movement modes and the input for the model's rotation.

```gdscript
onready var model = $Model
var velocity_model = Vector3()
var rotational_input = Vector2()

enum MOVEMENT_MODES {
	center,
	turn
}
export(MOVEMENT_MODES) var movement_mode = MOVEMENT_MODES.center
```

This code is called every engine tick that there is a user input. It accumulates all mouse inputs between one frame and the next into a variable called `input`.

```gdscript
func _input(event):
	if not player:
		return

	if event is InputEventMouseMotion:
		if movement_mode == MOVEMENT_MODES.center:
			input = ((get_viewport().size / 2.0).direction_to(get_viewport().get_mouse_position()))
			var distance = ((get_viewport().size / 2.0).distance_to(get_viewport().get_mouse_position()))

			if distance < DEAD_ZONE_RADIUS:
				distance = 1.0
			else:
				distance -= DEAD_ZONE_RADIUS
				distance = 1.0 - (distance / min(get_viewport().size.x, get_viewport().size.y))

			input = input.linear_interpolate(Vector2.ZERO, distance)
		elif movement_mode == MOVEMENT_MODES.turn:
			input += event.relative / (SENSITIVITY * 3.0)
			input = input.clamped(1.0)
```

Once all the inputs for a frame have be accumulated, the `_physics_process` function is called every frame that processes this `input` variable. This snippet sets the `rotational_input` and `velocity_model` variables for later use, as well as rotating the ship to point towards the input using `rotate_object_local`.

```gdscript
func _physics_process(delta):
	...
	if movement_mode == MOVEMENT_MODES.turn:
		input = lerp(input, Vector2.ZERO, 10.0 * delta)

	if not ($WarpTimer.time_left == 0 and not warp_charged):
		# Make turning more difficult if charging or charged...
		input *= 0.5

	rotational_input = lerp(rotational_input, input, turn_acceleration * delta)
	velocity_model.x = lerp(velocity_model.x, input.x * 50.0, acceleration_model * delta)
	velocity_model.y = lerp(velocity_model.y, -input.y * 50.0, acceleration_model * delta)

	# Make turning more difficult if looking too far up or down.
	var rot_speed_mod_extreme_angles = 1.0 - pow(sin(abs(rotation.x) / deg2rad(90.0)), 1.0)
	if rot_speed_mod_extreme_angles < 0.5:
		rot_speed_mod_extreme_angles *= 1.0 - (0.5 - rot_speed_mod_extreme_angles)

	rotate_object_local(Vector3.RIGHT, -rotational_input.y / SENSITIVITY)
	rotate_object_local(Vector3.UP, -rotational_input.x / SENSITIVITY * rot_speed_mod_extreme_angles)
	...
```

We can then handle the movement of the ship rather than the rotation. This is achieved by reading the inputs from the keyboard using `Input.get_vector` and applying that to the `global_transform.basis` rotation to get the input vector relative to the current rotation.

```gdscript
...
var new_movement_axis
var input_vector_keyboard = Input.get_vector("move_left", "move_right", "move_up", "move_down").normalized()
new_movement_axis = (global_transform.basis.z * input_vector_keyboard.y)
new_movement_axis += (global_transform.basis.x * input_vector_keyboard.x)
new_movement_axis = new_movement_axis.normalized()
...
```

We can then check the user inputs for boosting and warping and proceed accordingly...

```gdscript
...
if Input.is_action_pressed("boost"):
	should_boost_this_frame = true
	camera_fov = CAMERA_FOV_BOOST
else:
	camera_fov = CAMERA_FOV_NORMAL

$Camera.fov = lerp($Camera.fov, camera_fov, 1.5 * delta)

if Input.is_action_just_pressed("charge_warp"):
	begin_warp_charge()

ui.get_node("Warp").update_warp_ui($WarpTimer.wait_time - $WarpTimer.time_left, $WarpTimer.wait_time)

if Input.is_action_just_pressed("activate_warp"):
	if warp_charged:
		warp()
...
```

Once all user inputs have been processed, we can actually move the player. A check is also made for collisions and the player is bounced away from the collision object.

```gdscript
...
if should_boost_this_frame:
	new_movement_axis *= boost_mult

movement_axis = lerp(movement_axis, new_movement_axis * max_speed, thrust_acceleration * delta)
move_and_slide(movement_axis)

for collision_index in range(get_slide_count()):
	var collision = get_slide_collision(collision_index)

	if collision:
		hurt(null, int(movement_axis.length() / 45))
		movement_axis = movement_axis.bounce(collision.normal)

rotation_degrees.z = 0
rotation_degrees.x = clamp(rotation_degrees.x, -85, 85)
...
```

### AI Movement

The AI movement and player movement code use many of the same snippet as shown in the section prior. These will not be shown or explained again. The AI is based on a FSM (Finite State Machine) that controls how the AI should act. States are mainly set from the director rather than the AI script itself.

First, variables for the AI to use are defined:

```gdscript
var player = false
var target_marker : Position3D
var time_since_last_attack = 0.0
var min_attack_time = 15.0
var keep_distance_one_time_gen_new_target = true
var faction_str : String
var unaware_of_allies_hostile_ships = []
var state
var state_target
var ui_elem
```

When the spaceship is first created, all player-centric nodes are removed.

```gdscript
func _ready():
	...
	if not player:
		$Particles.queue_free()
		$Camera.queue_free()
		$Model/Particles.process_material = $Model/Particles.process_material.duplicate()
		$Model/Sprite3D.queue_free()
		$Model/Sprite3D2.queue_free()
```

The `_physics_process` method contains the logic for the FSM. When the ship is in the `ATTACK` state, it should turn toward the enemy (stored in the variable `state_target`) and move towards them. If it is too far away, it should boost to get closer faster. When it is close to the target ship, it should begin to shoot at it. As there is no limit of how close it should get to the enemy ship, it should transition to the `TOO_CLOSE` state when extremely close.

```gdscript
func _physics_process(delta):
	...
	time_since_last_attack += delta

	if state == get_parent().state.ATTACK:
		time_since_last_attack = 0

		if is_instance_valid(state_target) and not state_target.is_dead:
			target_marker.global_transform.origin = state_target.global_transform.origin + (state_target.movement_axis * 0.75)

			if global_transform.origin.distance_to(state_target.global_transform.origin) <= 30:
				state = get_parent().state.TOO_CLOSE
			elif global_transform.origin.distance_to(state_target.global_transform.origin) <= 150:
				shoot()

			if global_transform.origin.distance_to(state_target.global_transform.origin) >= 100:
				var rot_vector = -global_transform.basis.z
				if global_transform.origin.direction_to(state_target.global_transform.origin).dot(rot_vector) >= 0.75:
					should_boost_this_frame = true

		else:
			get_parent().set_states_for_faction(faction_str, self)
```

The `TOO_CLOSE` state is intended to stop ships from flying directly into each-other during the `ATTACK` state. It works by selecting a random point nearby and overriding the `ATTACK` state until the random point is reached...

```gdscript
elif state == get_parent().state.TOO_CLOSE:
	state_target = movement_axis / 5.0 + global_transform.origin + Vector3(
		rand_range(-1, 1),
		rand_range(-1, 1),
		rand_range(-1, 1)
	) * 10.0

	if keep_distance_one_time_gen_new_target:
		keep_distance_move_target()
		keep_distance_one_time_gen_new_target = false

	var dist_to_target = target_marker.global_transform.origin.distance_to(global_transform.origin)

	if dist_to_target <= 150 or target_marker.global_transform.origin == Vector3.ZERO:
		keep_distance_one_time_gen_new_target = true
		state = get_parent().state.ATTACK
```

The following function is used to move the `target_position` to a location in an area around the player.

```gdscript
func keep_distance_move_target():
	var player_circle_center

	if typeof(state_target) == TYPE_VECTOR3:
		player_circle_center = state_target
	else:
		player_circle_center = state_target.global_transform.origin

	var player_circle_radius = 125 + rand_range(0, 100)
	var circle_offset = randf() * 2 * PI
	var new_target_pos = Vector3(
		player_circle_center.x + player_circle_radius * cos(circle_offset),
		player_circle_center.y + rand_range(-50, 50),
		player_circle_center.z + player_circle_radius * sin(circle_offset)
	)

	new_target_pos = Vector3(
		clamp(new_target_pos.x, -10000, 10000),
		clamp(new_target_pos.y, -500, 500),
		clamp(new_target_pos.z, -10000, 10000)
	)

	target_marker.global_transform.origin = new_target_pos
```

The `KEEP_DISTANCE` state is used when the ship has enemies, but is not currently the ship (or ships) that are attacking (in the `ATTACK` state). It should hover around the area that the fighting is occurring. It is possible that during this state, an enemy ship may decide to attack it.

```gdscript
elif state == get_parent().state.KEEP_DISTANCE:
	if keep_distance_one_time_gen_new_target:
		keep_distance_move_target()
		keep_distance_one_time_gen_new_target = false

	var dist_to_target = target_marker.global_transform.origin.distance_to(global_transform.origin)

	if dist_to_target <= 50 or target_marker.global_transform.origin == Vector3.ZERO:
		keep_distance_one_time_gen_new_target = true
```

The `IDLE` state is used when a ship has no enemies on the current level. The ship should wander around the level using random waypoints.

```gdscript
elif state == get_parent().state.IDLE:
	var dist_to_target = target_marker.global_transform.origin.distance_to(global_transform.origin)

	if dist_to_target <= 75 or target_marker.global_transform.origin == Vector3.ZERO:
		var new_target_pos = Vector3(
			rand_range(-1000, 1000),
			rand_range(-150, 150),
			rand_range(-1000, 1000)
		)

		target_marker.global_transform.origin = new_target_pos
```

The `FLEE` state is used for ships that have no weapons and should flee when they get into combat (i.e., traders.) They should flee by facing away from the star of the solar system and charging, then activating, their warp to remove themselves from the level.

```gdscript
elif state == get_parent().state.FLEE:
	var sun_loc = Vector2.ZERO
	var dir_from_sun = sun_loc.direction_to(Vector2(global_transform.origin.x, global_transform.origin.z))
	var sun_extended = dir_from_sun * 99999

	target_marker.global_transform.origin = Vector3(sun_extended.x, global_transform.origin.y, sun_extended.y)

	if ($WarpTimer.time_left == 0 and not warp_charged):
		begin_warp_charge()
	elif warp_charged:
		warp()
```

After the state has been decided, the `input` variable is set to be a vector that points in the direction of the `target_marker` (used to direct the spaceship.) The code snippet for movement as seen in the player movement section then handles actually movement the ship.

```gdscript
var direction = self.global_transform.origin.direction_to(target_marker.global_transform.origin)
direction = direction.rotated(Vector3.UP, -rotation.y)
direction = direction.rotated(Vector3.RIGHT, -rotation.x)
input = Vector2(direction.x, -direction.y)

var dist_to_target = global_transform.origin.distance_to(target_marker.global_transform.origin)
new_movement_axis = (-global_transform.basis.z) * clamp(dist_to_target / 100, 0, 1)
```

## The Combat

### Hitbox Adjustment

To make the combat feel fair to player where they have to shoot ships moving in sometimes unpredictable ways from a considerable distance away, we can fake the time it take for bullets to travel through space. This means that the player can lead their shots and hit the target even if the target abruptly changes direction so the shot should not have actually hit. (See ["Shooting"](#shooting) section for the shooting works with this adjusted hitbox.)

This is achieved by having ships "carry" their hitbox for bullets (`HitScanBox`) out in-front of them. The hitbox is placed directly ahead of them in the direction they are moving (`movement_axis`) and the distance between them and the hitbox is relative to the distance between them and the player (to simulate having to lead your shots more if the enemy is farther away.) The scale is also adjusted to ensure the hitbox size is not ridiculously small if the enemy is far away.

`call_deferred` is used to call the method that actually moves the hitbox as it ensures that the hitbox is not moved between physics frames which could result in ray-casts not colliding correctly.

```gdscript
func _physics_process(delta):
	...
	var hitbox = $HitScanBox
	var dist_from_player

	if player:
		dist_from_player = 0
	else:
		dist_from_player = get_parent().player.get_node("Model").global_transform.origin.distance_to(get_node("Model").global_transform.origin)
	
	var aim_vector = get_node("Model").global_transform.origin + (movement_axis * dist_from_player / 300.0)

	var aim_dist_scale_mod
	if player:
		aim_dist_scale_mod = 1
	else:
		aim_dist_scale_mod = 7.5 / pow(dist_from_player, 0.125)

	call_deferred("adjust_hitbox_pos", aim_vector, aim_dist_scale_mod)
```

When we adjust the hitbox position, we also update the position of the collision hitbox (for colliding with planets, etc...) This ensures that the collision of the ship respects the current rotation of the ship when it moves.

```gdscript
func adjust_hitbox_pos(new_vector, new_scale):
	var hitbox = $HitScanBox
	hitbox.global_transform.origin = new_vector
	hitbox.scale = Vector3(new_scale, new_scale, new_scale)
	$CollisionShape.transform = $Model.transform
```

Please view these screenshots taken with physics areas and collisions visible:

![](/assets/space/hitbox1.png)
![](/assets/space/hitbox2.png)
![](/assets/space/hitbox3.png)

### Shooting

Bullets are fired from the `shoot()` method that is called when the player presses the shoot action. This is located within the same script as the movement shown in the above section.

```gdscript
func _physics_process(delta):
	...
	if player:
		if Input.is_action_pressed("shoot"):
			shoot()
	...
```

The bullet used is a very simple laser-like mesh with an emissive colour. It is made using Godot's built-in capsule mesh type. The scene contains a timer for cleaning up bullets that have existed for a long time without colliding. Is it important to note that the bullet's collision is not used, instead, whether or not the bullet collides with anything is determined separately.

![](/assets/space/bullet.png)
![](/assets/space/bullet-nodes.png)

To fire the bullet, we must first reference the bullet scene as well as an impact scene (just an explosion particle effect.)

```gdscript
const BULLET_SCENE = preload("res://Bullet.tscn")
const BULLET_IMPACT_SCENE = preload("res://BulletImpact.tscn")
```

Then we can create a bullet instance when the `shoot` method is called. We first need to check if the ship is able to fire by checking if the `ShotTimer` has finished (is `0`.) Please note that the bullet that is created is actually just an effect, the hit detection is handled later.

```gdscript
var last_firing_pos = 0

func shoot():
	if $ShotTimer.time_left == 0:
		$ShotTimer.start()

		var bullet = BULLET_SCENE.instance()
		bullet.firing_transform = $Model/FiringPos.get_child(last_firing_pos).global_transform
		last_firing_pos = wrapi(last_firing_pos + 1, 0, $Model/FiringPos.get_child_count())
		bullet.firing_speed = 50000

		get_parent().add_child(bullet)
		Sound.one_shot(self, "gunshot")
		...
```

To handle the hit detection, we need to fire a ray-cast from the player's current position directly forward from the camera (i.e., the crosshair in the centre of the screen.) For AI ships, we can *cheat* slightly; the AI will only call `shoot()` when it is facing it's target, so we can just fire the ray-cast to the target's hitbox. If the player is locked-on, we use the target hitbox's exact position.

```gdscript
var from
var to

if player:
	var center = get_viewport().size / 2.0

	from = get_viewport().get_camera().global_transform.origin
	to = get_viewport().get_camera().project_position(center, 5000.0)

	if lock_autoaim and is_locked:
		to = current_lock.get_node("HitScanBox").global_transform.origin
	
else:
	from = get_node("Model").global_transform.origin
	to = state_target.get_node("HitScanBox").global_transform.origin

var raycast = get_world().direct_space_state.intersect_ray(from, to, [get_node("HitScanBox"), self], 2, true, true)
```

If the ray-cast hits any target, we can then processed with the calculations. First, we define what should happen when an AI attempts to shoot. We can calculate the hit chance randomly based on how directly it faces the target and the distance between the AI and the target as seen below...

```gdscript
if not raycast.empty():
	if not player:
		var chance = clamp(1.0 / from.distance_to(to) * 20, 0, 1)
		var rot_vector = -get_node("Model").global_transform.basis.z
		var dot_product = get_node("Model").global_transform.origin.direction_to(state_target.get_node("HitScanBox").global_transform.origin).dot(rot_vector)
		var relative_speed = abs(movement_axis.length() - state_target.movement_axis.length())

		if dot_product <= 0.75:
			chance = 0
		else:
			chance *= dot_product
			chance *= clamp(15.0 / (relative_speed + 0.01), 0, 1)
		
		if randf() > chance:
			# Random chance failed...
			return
```

Next, regardless of AI or player, we can simulate bullet travel time from the firing ship to the target by using the `yield` function to pause processing until a timer has elapsed based on the distance between the source and target. `yield` allows all other scripts and functions to continue while the current function is paused (coroutines) ([More about `yield`](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html#coroutines-with-yield){:target="\_blank"}).

```gdscript
yield(get_tree().create_timer(from.distance_to(raycast["position"]) / 1000), "timeout")
```

After the function as resumed execution from the `yield`, we then check if what the ray-cast collided with (i.e, the target) is still valid before continuing. We can then create the bullet impact effect and place it in the correct location.

```gdscript
if is_instance_valid(raycast["collider"]):
	var impact = BULLET_IMPACT_SCENE.instance()
	impact.process_material.color_ramp = ResourceLoader.load("res://BulletGradientRed.tres")

	get_tree().get_root().add_child(impact)
	...
```

Also if the instance is still valid, we can check the type of what the ray-cast collided with to see if it is a spaceship or a planet/star. If it is a ship, we can called the `hurt()` method on the receiving ship to actually damage it. We also check whether the shot damaged the shield or the health of the target and adjust the colour of the impact effect accordingly to provide information to the player.
We also show the hit-marker and play a sound effect if the player fired the shot.

```gdscript
...
if raycast["collider"] is Area:
	if player:
		Sound.one_shot_no_pos("hitmarker")
		ui.get_node("CenterInfo").display_hitmarker()
	
	if raycast["collider"].get_parent().current_shield > 0:
		impact.process_material.color_ramp = ResourceLoader.load("res://BulletGradientBlue.tres")
	
	raycast["collider"].get_parent().hurt(self, 1)

	impact.global_transform.origin = raycast["collider"].get_parent().get_node("Model").global_transform.origin

else:
	impact.global_transform.origin = raycast["position"]
```

### Taking Damage

Every ship instance has the following variables to define its health and shield:

```gdscript
var max_health = 12
var max_shield = 6
var current_health
var current_shield
var shield_seconds_per_amount = 0.25
var shield_recharge_progress = 0.0
var shield_should_regenerate = false

func _ready():
	current_health = max_health
	current_shield = max_shield
	...
```

Within the ship's `_physics_process(delta)` method, use keep track of the shield's recharging process by adding the frame's delta (time since last frame) to a variable called `shield_recharge_progress`. When this variable exceeded a value, we add `1` to the ship's shield and reset the progress.

```gdscript
if shield_should_regenerate:
	shield_recharge_progress += delta

	if shield_recharge_progress >= shield_seconds_per_amount:
		shield_recharge_progress = 0.0
		current_shield = min(current_shield + 1, max_shield)

		if player:
			ui.get_node("HealthAndShield").update_values(self)
```

When a ship is hurt through any reason (bullet or collision) the `hurt` method is called. This method takes an amount of damage, and an optional source (`null` for collisions.) When the ship is hurt, it should stop regenerating shield and restart the timer...

```gdscript
func hurt(source, amount):
	if source != null:
		print(name + " took damage of " + str(amount) + " from " + source.name)
	else:
		print(name + " took damage of " + str(amount) + " from unknown source")

	shield_should_regenerate = false
	$ShieldTimer.start()
```

When it comes to modifying the health variables, we first need to check if the ship currently has a shield and if so, we should take the damage from the shield rather than the health. If the player is the one getting hurt, we flash the edges of the screen with an appropriate colour to give feedback to the player that they've been hit and what was hit (health or shield.)

```gdscript
if current_shield >= 1:
	current_shield = max(current_shield - amount, 0)

	if player:
		ui.get_node("FlashOverlay").color = Color.cyan
		ui.get_node("FlashOverlay").modulate.a = 1
	
	Sound.one_shot(self, "miss")

else:
	...
```

If the ship has no shield then we take the damage directly from the health. Again, flash feedback is given to the player and a relevant sound if played.

```gdscript
	...
else:
	current_health -= amount

	if player:
		ui.get_node("FlashOverlay").color = Color.red
		ui.get_node("FlashOverlay").modulate.a = 1
	
	Sound.one_shot(self, "damage_hit")
	...
```

For the player only, we can add additional effect that get activated upon taking enough damage. For example; here, we disable the player's targeting, meaning they now have to lead their shot manually. We also update the player's UI to reflect the new health and shield values.

```gdscript
...
if player:
	if current_health < (max_health / 2) and not lock_is_disabled:
		lock_time_progress = 0.0
		is_locked = false
		lock_is_disabled = true
		ui.alert("Warning!", "Targeting systems offline!", 5)
	
	ui.get_node("HealthAndShield").update_values(self)
```

If the ship has no health left, it should die... (See ["Dying"](#dying).)

```gdscript
if current_health <= 0:
	if not is_dead:
		die()
```

Finally we can handle what happens when the player attacks a neutral ship. This sets the relationship between the two factions involved in the combat to hostile and recalculates the states for the two involved factions.

```gdscript
if source:
	if not player:
		if not get_parent().faction[faction_str].aware_of_allies:
			if not (source in unaware_of_allies_hostile_ships):
				unaware_of_allies_hostile_ships.append(source)
	if source.faction_str != faction_str:
		get_parent().set_faction_relations(source.faction_str, faction_str, -100)
		get_parent().set_states_for_faction(source.faction_str, source)
		get_parent().set_states_for_faction(faction_str, self)
```

The shield timer that each ship scene contains is set to call the following function when it finished. It functions sets `shield_should_regenerate` to `true` so the ship can begin to regenerate its shield.

```gdscript
func _on_ShieldTimer_timeout():
	shield_should_regenerate = true
	shield_recharge_progress = 0
```

### Locking Targets

To help the player shooting enemies, there is a targeting system that allows the crosshair to automatically place itself over the enemy. Of course, it is still possible to aim and shoot without targeting the enemy. First, we define variables to control and assist in locking targets.

```gdscript
var locking_range = 250
var locking_radius_dot_product = 0.5
var current_lock = null
var is_locked = false
var time_to_lock = 1.0
var lock_time_progress = 0.0
var lock_autoaim = true
var lock_is_disabled = false
```

As the player is the only ship able to lock, we first check if the player is the ship executing this script. Then, we can try to clean up the currently locked object, making sure that it still exists and is not dead. If there is no current lock, we set the current lock progress to `0.0` and say that we are not locked.

```gdscript
if player:
	if current_lock != null:
		if not is_instance_valid(current_lock):
			current_lock = null
		if current_lock.is_dead:
			current_lock = null

	if current_lock == null:
		lock_time_progress = 0.0
		is_locked = false
```

We can then update the player's UI based on the current lock status.

```gdscript
ui.get_node("CenterInfo").set_targeting_bar(0, time_to_lock)
ui.get_node("CenterInfo").set_targeting_text("Select target")

if lock_is_disabled:
	ui.get_node("CenterInfo").set_targeting_text("ERROR: Targeting offline!")
```

Next, we need to determine what target out of all the possible ships in the level should be locked on to. This is achieved by calculating the dot product between all the ships positions relative to the camera, and the camera's forward direction. By the end of this snippet, `current_lock` contains the closest ship to the crosshair and the one that should be locked on to.

```gdscript
if lock_time_progress == 0 and not is_locked:
	var biggest_dot_product = -99.0
	is_locked = false

	for ship in director.ships:
		if ship == director.player:
			continue
		
		var rot_vector = -get_node("Camera").global_transform.basis.z
		var dot_product = get_node("Camera").global_transform.origin.direction_to(ship.global_transform.origin).dot(rot_vector)

		if dot_product >= 0.65:
			if dot_product > biggest_dot_product:
				current_lock = ship
				biggest_dot_product = dot_product
		
	if biggest_dot_product == -99.0:
		current_lock = null
```

Once we have the ship to be locked on to, we can then start locking on to it if the player presses the `lock_button` action. To successfully lock on to the target, the player must be facing in their general direction, this is implemented via another dot product check. The player must also be within a certain distance of the target to continue locking. Invalidating these conditions at any point (even when fully locked) will reset locking progress back to `0`.

```gdscript
if current_lock != null and not lock_is_disabled:
	if Input.is_action_pressed("lock_button"):
		ui.get_node("CenterInfo").set_targeting_text("Locking...")

		var rot_vector = -get_node("Camera").global_transform.basis.z
		var dot_product = get_node("Camera").global_transform.origin.direction_to(current_lock.global_transform.origin).dot(rot_vector)
		var distance = get_node("Model").global_transform.origin.distance_to(current_lock.get_node("Model").global_transform.origin)

		if dot_product < locking_radius_dot_product:
			ui.get_node("CenterInfo").set_targeting_text("ERROR: Turn to face target!")
			lock_time_progress = 0.0
			is_locked = false
		
		if distance > locking_range:
			ui.get_node("CenterInfo").set_targeting_text("ERROR: Target out of range!")
			lock_time_progress = 0.0
			is_locked = false
		...
```

While we are locking, we can set the position of the player's crosshair to track the target at a delay, and return to centre when not tracking. We can then also increment the lock time progress by the frame's delta if we are not currently locked and update the UI targeting bar to reflect this value. We then check if we the new value of `lock_time_progress` is above the time it takes to lock, if it is, we are locked and we set `is_locked` to `true`. We also update the UI accordingly.

```gdscript
...
if lock_autoaim and lock_time_progress != 0.0:
	ui.get_node("CenterInfo").set_target_screen_position(current_lock.get_node("HitScanBox").global_transform.origin, time_to_lock)
else:
	ui.get_node("CenterInfo").set_target_screen_position(null, 0)

if not is_locked:
	lock_time_progress += delta
	ui.get_node("CenterInfo").set_targeting_bar(lock_time_progress, time_to_lock)

if lock_time_progress >= time_to_lock:
	is_locked = true
	ui.get_node("CenterInfo").set_targeting_text("Locked!")
	ui.get_node("CenterInfo").set_targeting_bar(lock_time_progress, time_to_lock)
	ui.get_node("CenterInfo").force_to_target()
...
```

If, at any point, the player releases the locking button, we should stop all locking and reset progress:

```gdscript
	...
	else:
		lock_time_progress = 0.0
		is_locked = false
		if lock_autoaim:
			ui.get_node("CenterInfo").set_target_screen_position(null, 0.0)
```

We must also make sure to reset the position of the crosshair when we have no target or the locking system is disabled, otherwise it will remain in the tracking position and not reset to the centre of the screen.

```gdscript
if current_lock == null and not lock_is_disabled:
	if lock_autoaim:
		ui.get_node("CenterInfo").set_target_screen_position(null, 0.0)

if lock_is_disabled:
	ui.get_node("CenterInfo").set_target_screen_position(null, 0.0)
```

Finally, we can play sounds to help the player ascertain the progress of the lock.

```gdscript
if is_locked:
	Sound.play_locking(false)
elif lock_time_progress > 0.0:
	Sound.play_locking(true)
else:
	Sound.stop_locking()
```

### Dying

When a ship dies, we create an explosion effect and call the `clean_up()`.

```gdscript
func die():
	$Explosion.emitting = true
	clean_up()
```

The `clean_up()` method handles removing references to the ship from scripts such as the director, as well as removing parts of the ship that are not needed anyone, such as the model and the associated UI nameplate.

```gdscript
var is_dead = false

func clean_up():
	is_dead = true

	if not player:
		get_parent().ships.erase(self)
	
	if ui_elem:
		ui_elem.queue_free()
```

We also detach the particles from the ship's instance so when it is removed, the particle effects remain and can expire naturally.

```gdscript
var trail_particles = $Model/Particles
var smoke_particles = $Model/Particles2
var warp_particles = $Model/WarpEffect

$Model.remove_child(trail_particles)
$Model.remove_child(smoke_particles)
$Model.remove_child(warp_particles)

add_child(trail_particles)
add_child(smoke_particles)
add_child(warp_particles)

trail_particles.emitting = false
smoke_particles.emitting = false
warp_particles.emitting = false
```

Finally, we remove the unneeded models and hitboxes and tell the director to recompute the states for the current faction, given that one of them has just died. We wait 30 seconds and then remove the ship from the level.

```gdscript
$Model.queue_free()
$HitScanBox.queue_free()
$CollisionShape.queue_free()
get_parent().set_states_for_faction(faction_str, self)

yield(get_tree().create_timer(30), "timeout")
self.queue_free()
```

## The Director

The director is in charge of coordinating enemy states in their FMS (Finite State Machine). Each ship's AI has a limited set of control of their state, for example, when they get too close to the ship they are targeting they will change themselves to the `TOO_CLOSE` state. Having a global "director" for the enemy AI means we don't present the player with unfair situations, for example, all enemy ships deciding to attack all at once.

### Factions

To realise this behaviour, we first need to define states and factions that ships can have and belong to:

```gdscript
enum state {
	IDLE, # Non-combat
	KEEP_DISTANCE, # Combat, not attacking
	TOO_CLOSE, # Combat, too close to target
	ATTACK, # Combat, moving and attacking if hit chance high
	RETREAT, # Combat, low health
	FLEE, # Exit level via warp
}

# aware_of_allies
# Aware of what happens to other members of the faction and allies. If attacked, the others may fight or flee.

# combat_start_state
# Initial state when attacked by enemy (not friendly fire.)

var faction = {
	"ALLY": {
		"aware_of_allies": true,
		"combat_start_state": state.KEEP_DISTANCE,
		"faction_relations": {},
	},
	"UNAFFILIATED_TRADER": {
		"aware_of_allies": false,
		"combat_start_state": state.FLEE,
		"faction_relations": {},
	},
	"UNAFFILIATED_HUNTER": {
		"aware_of_allies": false,
		"combat_start_state": state.ATTACK,
		"faction_relations": {},
	},
	"PIRATE": {
		"aware_of_allies": true,
		"combat_start_state": state.KEEP_DISTANCE,
		"faction_relations": {},
	},
	"WAR_A": {
		"aware_of_allies": true,
		"combat_start_state": state.KEEP_DISTANCE,
		"faction_relations": {},
	},
	"WAR_B": {
		"aware_of_allies": true,
		"combat_start_state": state.KEEP_DISTANCE,
		"faction_relations": {},
	},
}
```

Once the factions have been defined and declared, we can then initialise the relations between the different factions, stored as an integer between `-100` and `100`. The higher the value, the more the two factions like each-other. `initialise_faction_relations()` ensures that every faction has every other faction in its relations dictionary, with its relation at a default `0`.

```gdscript
func _ready():
	...
	initialise_faction_relations()
	set_faction_relations("PIRATE", "UNAFFILIATED_TRADER", -100)
	set_faction_relations("PIRATE", "UNAFFILIATED_HUNTER", -100)
	set_faction_relations("PIRATE", "ALLY", -100)
	set_faction_relations("WAR_A", "WAR_B", -100)
	...

func initialise_faction_relations():
	for fac1 in faction.keys():
		for fac2 in faction.keys():
			if fac2 == fac1:
				continue
			faction[fac1].faction_relations[fac2] = 0

func set_faction_relations(fac1, fac2, absolute_value):
	var should_update_states = false
	if faction[fac1].faction_relations[fac2] != absolute_value:
		faction[fac1].faction_relations[fac2] = absolute_value
		faction[fac2].faction_relations[fac1] = absolute_value
		should_update_states = true
	if !faction[fac1].aware_of_allies or !faction[fac2].aware_of_allies or should_update_states:
		should_update_states = true
	return should_update_states
```

### States

Once the factions and their relations have been set-up, we can then set the states for each ship. First, we find all the hostile factions to the faction whose states we are processing:

```gdscript
func _ready():
	...
	for faction_str in faction.keys():
		set_states_for_faction(faction_str, null)

func set_states_for_faction(fac, calling_ship):
	var fac_info = faction[fac]
	var hostile_factions = []
	for fac2 in fac_info.faction_relations.keys():
		if is_faction_hostile_to(fac, fac2):
			hostile_factions.append(fac2)
	...

func is_faction_hostile_to(fac1, fac2):
	if fac1 == fac2:
		return false
	return (faction[fac1].faction_relations[fac2] <= -80)
```

Continuing `set_states_for_faction`, what we do next depends on whether the ship is acting independently of a faction or not. For example, the factions `UNAFFILIATED_TRADER` and `UNAFFILIATED_HUNTER` should not care what happens to other members of their faction, whereas other factions ships should all become hostile if a single member of their factions is attacked.

```gdscript
if fac_info.aware_of_allies:
	var goto_state
	var attacking_ships = []
	var attacking_ships_temp = []
	var number_of_concurrent_attacks = 0
	var average_state_loc = get_average_ship_location_factions(hostile_factions)

	var target_array = get_ships_healthshield_order_high_to_low_from_factions(hostile_factions)
	if not target_array.empty():
		number_of_concurrent_attacks = max(int(target_array.size() / 2.0), 1)

	var attacking_ship_array = get_ships_healthshield_order_high_to_low_from_factions([fac])
	attacking_ship_array.erase(player)

	goto_state = fac_info.combat_start_state
	if goto_state == state.FLEE:
		number_of_concurrent_attacks = 0

	for attacking_ship in attacking_ship_array:
		if attacking_ship.state == state.ATTACK:
			attacking_ships_temp.append([attacking_ship, -attacking_ship.min_attack_time])
		else:
			attacking_ships_temp.append([attacking_ship, -attacking_ship.time_since_last_attack])
	attacking_ships_temp.sort_custom(self, "sort_ships_high_low")

	if not attacking_ships_temp.empty():
		while attacking_ships.size() != number_of_concurrent_attacks and not attacking_ships_temp.empty():
			attacking_ships.append(attacking_ships_temp.pop_front()[0])
	...
```

After this chunk of code, we have an array called `attacking_ships` that is an ordered list of ships that can attack, ordered by health high to low. Next we decide what state each ship belonging to the faction should be. (Several methods, such as `get_closest_ship_from_factions`, have been excluded from the code snippet.)

```gdscript
var exclude = []

if target_array.empty():
	goto_state = state.IDLE
	attacking_ships = []

for ship in get_all_ships_from_faction(fac):
	ship.state = goto_state

	if ship in attacking_ships:
		var ship_index = attacking_ships.find(ship)
		ship.state = state.ATTACK

		if ship_index > target_array.size():
			ship.state = goto_state
			ship.state_target = average_state_loc
		else:
			var target_ship = get_closest_ship_from_factions(hostile_factions, ship, exclude)
			exclude.append(target_ship)
			ship.state_target = target_ship

	else:
		ship.state_target = average_state_loc
```

For ships that should not react to allies being attacked, we used a different set of conditions. Hostile ships are not read from the faction like before, but are instead read from the ship's `unaware_of_allies_hostile_ships` array...

```gdscript
...
else:
	for ship in get_all_ships_from_faction(fac):
		if ship.unaware_of_allies_hostile_ships.empty():
			continue
		for ship2 in ship.unaware_of_allies_hostile_ships:
			if not is_instance_valid(ship2):
				ship.unaware_of_allies_hostile_ships.erase(ship2)
			elif ship2.is_dead:
				ship.unaware_of_allies_hostile_ships.erase(ship2)

		var goto_state = fac_info.combat_start_state
		var targets = ship.unaware_of_allies_hostile_ships
		if not targets.empty():
			calling_ship.state = goto_state
			calling_ship.state_target = targets[randi() % targets.size()]
		else:
			calling_ship.state = state.IDLE
```

The director script is also in charge of creating new enemy ships, as well as the player, when the level is initially loaded. The following code can be used to instantiate any type of ship within the level...

```gdscript
var ships = []

const SHIP_SCENE = preload("res://Ship.tscn")
const SHIP_UI_SCENE = preload("res://ShipInfo.tscn")

func spawn_ship(is_player, ship_faction):
	var ship_inst = SHIP_SCENE.instance()
	var ship_target = Position3D.new()
	ship_inst.state = state.IDLE
	ship_inst.state_target = null
	ship_inst.player = is_player

	if not is_player:
		ship_inst.ui_elem = SHIP_UI_SCENE.instance()

	ship_inst.max_health = 6
	ship_inst.max_shield = 3
	ship_inst.faction_str = ship_faction
	ship_inst.target_marker = ship_target
	ship_inst.director = self
	ship_inst.ui = get_parent().get_node("CanvasLayer/Control")

	add_child(ship_target)
	add_child(ship_inst)

	if is_player:
		# Player start position
		ship_inst.global_transform.origin = Vector3(0, 0, 256)
	else:
		ship_inst.global_transform.origin = player.global_transform.origin + Vector3(rand_range(-200, 200), rand_range(-200, 200), rand_range(-200, 200))

	ships.append(ship_inst)

	if ship_inst.ui_elem:
		world_ui.add_child(ship_inst.ui_elem)
		ship_inst.ui.get_node("HealthAndShield").update_values(ship_inst)

	return ship_inst
```

This function is utilised in the `_ready()` method to create the initial population of the level:

```gdscript
var player

func _ready():
	...
	player = spawn_ship(true, "ALLY")
	spawn_ship(false, "UNAFFILIATED_TRADER")
	spawn_ship(false, "UNAFFILIATED_TRADER")
	spawn_ship(false, "UNAFFILIATED_TRADER")
	spawn_ship(false, "UNAFFILIATED_HUNTER")
	spawn_ship(false, "UNAFFILIATED_HUNTER")
	...
```

I also added a way to spawn different kinds of ships to help with testing:

```gdscript
func _input(event):
	if event is InputEventKey:
		if event.scancode == KEY_E and event.pressed:
			spawn_ship(false, "WAR_A")
		if event.scancode == KEY_Q and event.pressed:
			spawn_ship(false, "WAR_B")
		if event.scancode == KEY_1 and event.pressed:
			spawn_ship(false, "ALLY")
```

## Sound Effects

### External

[Explosion, 8-bit, 01](https://freesound.org/people/InspectorJ/sounds/448226/) by InspectorJ under the Creative Commons Attribution 4.0 License.

<audio controls>
	<source src="/assets/space/audio/448226_5121236-lq.mp3">
</audio>

[Hitmarker Sound Effect](https://freesound.org/people/User391915396/sounds/570335/) by User391915396 under the Creative Commons 0 License.

<audio controls>
	<source src="/assets/space/audio/570335_6384533-lq.mp3">
</audio>

### Created Myself

Critical

<audio controls>
	<source src="/assets/space/audio/critical.ogg">
</audio>

Damage

<audio controls>
	<source src="/assets/space/audio/damage.ogg">
</audio>

Engine (Original)

<audio controls>
	<source src="/assets/space/audio/engine.wav">
</audio>

Engine (Seamless Loop)

<audio controls>
	<source src="/assets/space/audio/engine_looped.ogg">
</audio>

Gunshot

<audio controls>
	<source src="/assets/space/audio/gunshot.ogg">
</audio>

Space Gunshot

<audio controls>
	<source src="/assets/space/audio/sfx_01.ogg">
</audio>

Lock-on (Locked)

<audio controls>
	<source src="/assets/space/audio/lock_on_locked.ogg">
</audio>

Lock-on (Locking)

<audio controls>
	<source src="/assets/space/audio/lock_on_locking.ogg">
</audio>

Low Health

<audio controls>
	<source src="/assets/space/audio/low_health.ogg">
</audio>

Miss

<audio controls>
	<source src="/assets/space/audio/miss.ogg">
</audio>

Menu Confirm

<audio controls>
	<source src="/assets/space/audio/select.ogg">
</audio>

Menu Negative

<audio controls>
	<source src="/assets/space/audio/negative.ogg">
</audio>

Ready Weapon

<audio controls>
	<source src="/assets/space/audio/ready_weapon.ogg">
</audio>

Unready Weapon

<audio controls>
	<source src="/assets/space/audio/unready_weapon.ogg">
</audio>

## Credits

-   [Inspiration](https://www.youtube.com/watch?v=t_zN-7Xggw4){:target="\_blank"}
-   [Background/Skybox texture](https://harambert.itch.io/assets-3d-space-shooter-tutorial){:target="\_blank"}
-   [Polyliner](https://godotengine.org/asset-library/asset/1313){:target="\_blank"}
-   [Offscreen Indicators](https://www.youtube.com/watch?v=gAQpR1GN0Os){:target="\_blank"}
