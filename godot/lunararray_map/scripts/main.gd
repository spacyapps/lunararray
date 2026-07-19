extends Node3D
## Root of the Godot map: moon overview + local base scenes + UI signals.

@onready var camera_rig: Node3D = $CameraRig
@onready var moon: Node3D = $Moon
@onready var base_root: Node3D = $BaseRoot
@onready var hotspots: Node3D = $Hotspots
@onready var ui: CanvasLayer = $UI
@onready var status_label: Label = $UI/Status
@onready var station_label: Label = $UI/StationInfo
@onready var fade: ColorRect = $UI/Fade

var _map_cam: Node
var _active_base: Node3D = null


func _ready() -> void:
	_map_cam = camera_rig
	if camera_rig.has_signal("mode_changed"):
		camera_rig.mode_changed.connect(_on_mode_changed)
	if camera_rig.has_signal("explore_ready"):
		camera_rig.explore_ready.connect(_on_explore_ready)
	_spawn_hotspots()
	_set_fade(0.0)
	status_label.text = "9 nodes · Near side · Octogram · click a station"


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		if camera_rig.has_method("notify_user_input"):
			camera_rig.notify_user_input()
	if event.is_action_pressed("ui_cancel"):
		if camera_rig.has_method("exit_one_level"):
			camera_rig.exit_one_level()
	if event.is_action_pressed("approach"):
		_toggle_approach()
	if event.is_action_pressed("enter_base"):
		if camera_rig.has_method("enter_interior"):
			camera_rig.enter_interior()


func _toggle_approach() -> void:
	if not camera_rig:
		return
	if camera_rig.mode == camera_rig.Mode.BASE:
		camera_rig.start_approach()
	elif camera_rig.mode == camera_rig.Mode.APPROACH:
		camera_rig.start_wider()


func _spawn_hotspots() -> void:
	for s in StationData.stations:
		var btn := MeshInstance3D.new()
		var mesh := SphereMesh.new()
		mesh.radius = 0.06 if s.angle != null else 0.09
		mesh.height = mesh.radius * 2.0
		btn.mesh = mesh
		var mat := StandardMaterial3D.new()
		mat.albedo_color = s.accent
		mat.emission_enabled = true
		mat.emission = s.accent
		mat.emission_energy_multiplier = 1.4
		btn.material_override = mat
		var pos: Vector3 = StationData.station_world(s.id) * 1.02
		btn.position = pos
		btn.set_meta("station_id", s.id)
		# Click proxy
		var area := Area3D.new()
		var col := CollisionShape3D.new()
		var shape := SphereShape3D.new()
		shape.radius = 0.15
		col.shape = shape
		area.add_child(col)
		area.input_ray_pickable = true
		area.set_meta("station_id", s.id)
		area.input_event.connect(_on_hotspot_input.bind(s.id))
		btn.add_child(area)
		hotspots.add_child(btn)


func _on_hotspot_input(_camera: Node, event: InputEvent, _pos: Vector3, _normal: Vector3, _shape_idx: int, id: String) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_select_station(id)


func _select_station(id: String) -> void:
	if camera_rig.mode != camera_rig.Mode.MAP:
		return
	_set_fade(1.0)
	await get_tree().create_timer(0.15).timeout
	_mount_base(id)
	if camera_rig.has_method("dive_to"):
		camera_rig.dive_to(id)
	_set_fade(0.0)


func _mount_base(id: String) -> void:
	if _active_base:
		_active_base.queue_free()
		_active_base = null
	var path := "res://scenes/bases/%s.tscn" % id.replace("-", "")
	# LA-00 → LA00.tscn naming
	var short := id.replace("-", "")
	path = "res://scenes/bases/%s.tscn" % short
	if ResourceLoader.exists(path):
		var packed: PackedScene = load(path)
		_active_base = packed.instantiate()
	else:
		_active_base = _make_placeholder(id)
	base_root.add_child(_active_base)
	base_root.visible = true
	moon.visible = false
	hotspots.visible = false


func _make_placeholder(id: String) -> Node3D:
	var root := Node3D.new()
	root.name = id
	var env_scene: PackedScene = load("res://scenes/base_environment.tscn")
	if env_scene:
		root.add_child(env_scene.instantiate())
	var marker := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.3
	cyl.bottom_radius = 1.2
	cyl.height = 4.0
	marker.mesh = cyl
	marker.position.y = 2.0
	var s := StationData.get_station(id)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = s.get("accent", Color.WHITE)
	mat.emission_enabled = true
	mat.emission = mat.albedo_color
	marker.material_override = mat
	root.add_child(marker)
	return root


func _on_mode_changed(mode: String, id: String) -> void:
	var s := StationData.get_station(id) if id != "" else {}
	match mode:
		"map":
			status_label.text = "9 nodes · Near side · Octogram · click a station"
			station_label.text = ""
			moon.visible = true
			hotspots.visible = true
			base_root.visible = false
			if _active_base:
				_active_base.queue_free()
				_active_base = null
		"dive":
			status_label.text = "On approach"
			station_label.text = "%s · %s" % [id, s.get("name", "")]
		"base":
			status_label.text = "Explore · drag orbit · A approach · Esc array"
			station_label.text = "%s · %s\n%s" % [id, s.get("name", ""), s.get("purpose", "")]
		"approach":
			status_label.text = "Close approach · A wider · Esc array"
		"interior":
			status_label.text = "Residence · Esc exit"
			station_label.text = "LA-08 · Residential bay · wall-crown gardens"
		"rise":
			status_label.text = "Returning to array"


func _on_explore_ready(ready: bool) -> void:
	status_label.modulate.a = 1.0 if ready else 0.6


func _set_fade(a: float) -> void:
	if fade:
		fade.color.a = a


func _on_return_pressed() -> void:
	if camera_rig.has_method("exit_one_level"):
		camera_rig.exit_one_level()


func _on_enter_pressed() -> void:
	if camera_rig.has_method("enter_interior"):
		camera_rig.enter_interior()
