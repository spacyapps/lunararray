extends Node3D
## LA-08 residential bay — photo-first surfaces, wall-crown hydroponics.

@onready var window_view: MeshInstance3D = $WindowView
@onready var furniture: MeshInstance3D = $FurnitureHero
@onready var hydro: Node3D = $Hydroponics


func _ready() -> void:
	_apply_tex(window_view, "res://assets/textures/window-lunar-view.jpg", true)
	_apply_tex(furniture, "res://assets/textures/interior-furniture.jpg", true)
	_build_hydro_strips()
	_apply_wall_floor()


func _apply_wall_floor() -> void:
	var wall := get_node_or_null("Walls") as MeshInstance3D
	if wall:
		var mat := StandardMaterial3D.new()
		var t := _tex("res://assets/textures/interior-wall.jpg")
		if t:
			mat.albedo_texture = t
			mat.uv1_scale = Vector3(2.2, 1.5, 1)
		mat.roughness = 0.65
		wall.material_override = mat
	var floor_m := get_node_or_null("Floor") as MeshInstance3D
	if floor_m:
		var mat2 := StandardMaterial3D.new()
		var t2 := _tex("res://assets/textures/interior-floor.jpg")
		if t2:
			mat2.albedo_texture = t2
			mat2.uv1_scale = Vector3(3, 3, 1)
		mat2.roughness = 0.55
		floor_m.material_override = mat2


func _apply_tex(mi: MeshInstance3D, path: String, unshaded: bool) -> void:
	if mi == null:
		return
	var mat := StandardMaterial3D.new()
	var t := _tex(path)
	if t:
		mat.albedo_texture = t
	if unshaded:
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.roughness = 0.5
	mi.material_override = mat


func _build_hydro_strips() -> void:
	if hydro == null:
		return
	var greenery := _tex("res://assets/textures/hydroponic-greenery.jpg")
	var specs := [
		{"pos": Vector3(0, 2.9, 3.5), "rot": Vector3(0, PI, 0), "len": 7.5},
		{"pos": Vector3(-4.1, 2.9, 0), "rot": Vector3(0, PI / 2, 0), "len": 6.0},
		{"pos": Vector3(4.1, 2.9, 0), "rot": Vector3(0, -PI / 2, 0), "len": 6.0},
	]
	for s in specs:
		var strip := MeshInstance3D.new()
		var plane := PlaneMesh.new()
		plane.size = Vector2(s.len, 0.55)
		strip.mesh = plane
		strip.position = s.pos
		strip.rotation = s.rot
		var mat := StandardMaterial3D.new()
		if greenery:
			mat.albedo_texture = greenery
		else:
			mat.albedo_color = Color("3aa86a")
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
		mat.alpha_scissor_threshold = 0.12
		mat.cull_mode = BaseMaterial3D.CULL_DISABLED
		strip.material_override = mat
		hydro.add_child(strip)


func _tex(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path) as Texture2D
	return null
