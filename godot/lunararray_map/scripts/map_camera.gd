extends Node3D
## Camera director — map → dive → base ⇄ approach → interior → rise.
## Attach as sibling of Camera3D named "Camera3D".

signal mode_changed(mode: String, station_id: String)
signal explore_ready(ready: bool)

enum Mode { MAP, DIVE, BASE, APPROACH, INTERIOR, RISE }

const DIVE_DUR := 2.4
const RISE_DUR := 2.0
const APPROACH_DUR := 2.2
const ENTER_DUR := 2.0
const EXIT_DUR := 1.6

const MAP_POS := Vector3(0.0, 0.9, 6.4)
const MAP_FOV := 42.0

@export var camera_path: NodePath = ^"Camera3D"
@export var orbit_radius := 32.0
@export var orbit_height := 12.0
@export var orbit_period := 48.0
@export var approach_radius := 16.0
@export var approach_height := 6.0
@export var interior_radius := 3.2
@export var interior_height := 1.55
@export var interior_focus := Vector3(0, 1.45, 0)

var mode: Mode = Mode.MAP
var station_id: String = ""
var _cam: Camera3D
var _t0 := 0.0
var _from_pos := Vector3.ZERO
var _from_look := Vector3.ZERO
var _phase := 0.0
var _auto_orbit := true
var _user_pause_until := 0.0


func _ready() -> void:
	_cam = get_node_or_null(camera_path) as Camera3D
	if _cam == null:
		_cam = get_viewport().get_camera_3d()
	if _cam:
		_cam.global_position = MAP_POS
		_cam.look_at(Vector3.ZERO, Vector3.UP)
		_cam.fov = MAP_FOV
	mode_changed.emit("map", "")


func _process(delta: float) -> void:
	if _cam == null:
		return
	var now := Time.get_ticks_msec() / 1000.0
	match mode:
		Mode.MAP:
			pass
		Mode.DIVE:
			_process_dive(now)
		Mode.BASE, Mode.APPROACH:
			_process_orbit(now, delta)
		Mode.INTERIOR:
			_process_interior(now, delta)
		Mode.RISE:
			_process_rise(now)


func dive_to(id: String) -> void:
	station_id = id
	mode = Mode.DIVE
	_t0 = Time.get_ticks_msec() / 1000.0
	_from_pos = _cam.global_position
	_from_look = Vector3.ZERO
	explore_ready.emit(false)
	mode_changed.emit("dive", id)


func start_approach() -> void:
	if mode != Mode.BASE:
		return
	mode = Mode.APPROACH
	_t0 = Time.get_ticks_msec() / 1000.0
	_from_pos = _cam.global_position
	explore_ready.emit(false)
	mode_changed.emit("approach", station_id)


func start_wider() -> void:
	if mode != Mode.APPROACH:
		return
	mode = Mode.BASE
	_t0 = Time.get_ticks_msec() / 1000.0
	mode_changed.emit("base", station_id)
	explore_ready.emit(true)


func enter_interior() -> void:
	if mode != Mode.BASE and mode != Mode.APPROACH:
		return
	if not StationData.can_enter(station_id):
		return
	mode = Mode.INTERIOR
	_t0 = Time.get_ticks_msec() / 1000.0
	_from_pos = _cam.global_position
	explore_ready.emit(false)
	mode_changed.emit("interior", station_id)


func exit_one_level() -> void:
	match mode:
		Mode.INTERIOR:
			mode = Mode.BASE
			_t0 = Time.get_ticks_msec() / 1000.0
			mode_changed.emit("base", station_id)
			explore_ready.emit(true)
		Mode.APPROACH, Mode.BASE:
			rise_to_map()
		_:
			pass


func rise_to_map() -> void:
	mode = Mode.RISE
	_t0 = Time.get_ticks_msec() / 1000.0
	_from_pos = StationData.station_world(station_id) * (1.0 + 0.32 / StationData.MOON_RADIUS)
	explore_ready.emit(false)
	mode_changed.emit("rise", station_id)


func notify_user_input() -> void:
	_auto_orbit = false
	_user_pause_until = Time.get_ticks_msec() / 1000.0 + 2.8


func _ease(t: float) -> float:
	t = clampf(t, 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)


func _process_dive(now: float) -> void:
	var t := (now - _t0) / DIVE_DUR
	var e := _ease(t)
	var target := StationData.station_world(station_id) * (1.0 + 0.32 / StationData.MOON_RADIUS)
	var look := StationData.station_world(station_id)
	_cam.global_position = _from_pos.lerp(target, e)
	var look_pt := _from_look.lerp(look, minf(1.0, e * 1.4))
	_cam.look_at(look_pt, Vector3.UP)
	if t >= 1.0:
		mode = Mode.BASE
		_phase = 0.0
		_t0 = now
		_auto_orbit = true
		mode_changed.emit("base", station_id)
		explore_ready.emit(true)


func _process_orbit(now: float, delta: float) -> void:
	if now > _user_pause_until:
		_auto_orbit = true
	if not _auto_orbit:
		return
	_phase += delta
	var r := approach_radius if mode == Mode.APPROACH else orbit_radius
	var h := approach_height if mode == Mode.APPROACH else orbit_height
	var period := orbit_period * (0.85 if mode == Mode.APPROACH else 1.0)
	var ang := -PI / 3.0 + (_phase / period) * TAU
	var breath := sin(_phase * 0.21) * h * 0.18
	var pos := Vector3(cos(ang) * r, h + breath, sin(ang) * r)
	# Local base scenes sit at origin; world map dive hands off to base layer.
	_cam.global_position = pos
	_cam.look_at(Vector3(0, 3.0, 0), Vector3.UP)
	_cam.fov = MAP_FOV


func _process_interior(now: float, delta: float) -> void:
	var t := (now - _t0) / ENTER_DUR
	if t < 1.0:
		var e := _ease(t)
		var ang0 := 0.15 * PI
		var target := Vector3(cos(ang0) * interior_radius, interior_height, sin(ang0) * interior_radius)
		_cam.global_position = _from_pos.lerp(target, e)
		_cam.look_at(interior_focus, Vector3.UP)
		_cam.fov = lerpf(MAP_FOV, 55.0, e)
		return
	if now > _user_pause_until:
		_auto_orbit = true
	if not _auto_orbit:
		return
	_phase += delta
	var ang := (_phase / 52.0) * TAU + 0.15 * PI
	var breath := sin(_phase * 0.18) * 0.12
	_cam.global_position = Vector3(
		cos(ang) * (interior_radius + breath),
		interior_height + sin(_phase * 0.15) * 0.15,
		sin(ang) * (interior_radius + breath)
	)
	_cam.look_at(interior_focus, Vector3.UP)
	_cam.fov = 55.0


func _process_rise(now: float) -> void:
	var t := (now - _t0) / RISE_DUR
	var e := _ease(t)
	_cam.global_position = _from_pos.lerp(MAP_POS, e)
	var look := StationData.station_world(station_id).lerp(Vector3.ZERO, minf(1.0, e * 1.4))
	_cam.look_at(look, Vector3.UP)
	_cam.fov = MAP_FOV
	if t >= 1.0:
		mode = Mode.MAP
		station_id = ""
		_cam.global_position = MAP_POS
		_cam.look_at(Vector3.ZERO, Vector3.UP)
		mode_changed.emit("map", "")
