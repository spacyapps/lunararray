extends Node3D
## LA-00 Sinus Medii — spaceport + service hatch easter egg (MMDD code).

const ACCENT := Color("5cd6ff")
const WARM := Color("ffd9a0")

@onready var hatch: Area3D = $Hatch
@onready var keypad: Control = $UI/Keypad
@onready var hologram: Node3D = $Hologram
@onready var code_label: Label = $UI/Keypad/Panel/Code
@onready var status_label: Label = $UI/Keypad/Panel/Status

var _digits := ""
var _unlocked := false


func _ready() -> void:
	if hologram:
		hologram.visible = false
	if keypad:
		keypad.visible = false
	if hatch:
		hatch.input_event.connect(_on_hatch_input)
	_build_spire()


func _build_spire() -> void:
	var spire := MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = 3.2
	mesh.height = 18.0
	spire.mesh = mesh
	spire.position = Vector3(0, 9.0, 0)
	spire.rotation.z = -0.07
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("eef2f7")
	var tex := _tex("res://assets/textures/la00-spire-hull.jpg")
	if tex == null:
		tex = _tex("res://assets/textures/hull-panel.jpg")
	if tex:
		mat.albedo_texture = tex
	mat.metallic = 0.4
	mat.roughness = 0.38
	spire.material_override = mat
	add_child(spire)
	# Terminal dome
	var dome := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = 9.0
	sph.is_hemisphere = true
	dome.mesh = sph
	dome.scale.y = 0.38
	var dmat := StandardMaterial3D.new()
	dmat.albedo_color = Color(0.8, 0.9, 1.0, 0.45)
	dmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	dmat.emission_enabled = true
	dmat.emission = WARM * 0.4
	var dtex := _tex("res://assets/textures/dome-glass.jpg")
	if dtex:
		dmat.albedo_texture = dtex
	dome.material_override = dmat
	add_child(dome)


func _on_hatch_input(_c: Node, event: InputEvent, _p: Vector3, _n: Vector3, _i: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if _unlocked:
			return
		if keypad:
			keypad.visible = not keypad.visible
			_digits = ""
			_refresh_code()


func _expected_code() -> String:
	var t := Time.get_datetime_dict_from_system()
	return "%02d%02d" % [t.month, t.day]


func _on_key(k: String) -> void:
	if k == "C":
		_digits = ""
	elif k == "B":
		if _digits.length() > 0:
			_digits = _digits.substr(0, _digits.length() - 1)
	elif _digits.length() < 4:
		_digits += k
	_refresh_code()
	if _digits.length() == 4:
		if _digits == _expected_code():
			status_label.text = "Access granted"
			status_label.modulate = Color("7cffc4")
			_unlocked = true
			await get_tree().create_timer(0.5).timeout
			if keypad:
				keypad.visible = false
			if hologram:
				hologram.visible = true
		else:
			status_label.text = "Access denied"
			status_label.modulate = Color("ff5c5c")
			await get_tree().create_timer(0.75).timeout
			_digits = ""
			status_label.text = "Enter code"
			status_label.modulate = Color(1, 1, 1, 0.4)
			_refresh_code()


func _refresh_code() -> void:
	if code_label:
		var show := ""
		for i in 4:
			show += (_digits[i] if i < _digits.length() else "·") + " "
		code_label.text = show.strip_edges()


func _tex(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path) as Texture2D
	return null


func _on_close() -> void:
	if keypad:
		keypad.visible = false
