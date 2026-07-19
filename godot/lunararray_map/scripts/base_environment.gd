extends Node3D
## Shared lunar pad: regolith ground, rocks, Earth billboard, key light.

@export var ground_color := Color("9a9588")
@export var seed_value := 1

@onready var ground: MeshInstance3D = $Ground
@onready var earth: MeshInstance3D = $Earth
@onready var sun_key: DirectionalLight3D = $SunKey


func _ready() -> void:
	_setup_ground()
	_setup_earth()
	_scatter_rocks()


func _setup_ground() -> void:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = ground_color
	var tex := _try_tex("res://assets/textures/lunar-regolith.jpg")
	if tex:
		mat.albedo_texture = tex
		mat.roughness = 0.97
		mat.uv1_scale = Vector3(12, 12, 12)
	if ground:
		ground.material_override = mat


func _setup_earth() -> void:
	if earth == null:
		return
	var mat := StandardMaterial3D.new()
	var tex := _try_tex("res://assets/textures/earth-disk.jpg")
	if tex:
		mat.albedo_texture = tex
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	else:
		mat.albedo_color = Color("2f6ad4")
		mat.emission_enabled = true
		mat.emission = Color("1a3a6a")
	earth.material_override = mat


func _scatter_rocks() -> void:
	var multi := MultiMeshInstance3D.new()
	var mm := MultiMesh.new()
	var mesh := SphereMesh.new()
	mesh.radius = 0.5
	mesh.height = 1.0
	mesh.radial_segments = 8
	mesh.rings = 4
	mm.mesh = mesh
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.instance_count = 64
	var rock_mat := StandardMaterial3D.new()
	rock_mat.albedo_color = Color("7a766c")
	var rtex := _try_tex("res://assets/textures/lunar-rock.jpg")
	if rtex:
		rock_mat.albedo_texture = rtex
	rock_mat.roughness = 0.96
	# Apply via mesh surface if needed — MultiMeshInstance uses mesh material
	mesh.material = rock_mat
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value * 9973
	for i in mm.instance_count:
		var a := rng.randf() * TAU
		var r := 14.0 + rng.randf() * 70.0
		var s := 0.2 + rng.randf() * rng.randf() * 1.2
		var xf := Transform3D.IDENTITY
		xf.origin = Vector3(cos(a) * r, s * 0.28, sin(a) * r)
		xf.basis = Basis.from_euler(Vector3(rng.randf() * PI, rng.randf() * PI, 0.0))
		xf.basis = xf.basis.scaled(Vector3(s, s * (0.5 + rng.randf() * 0.5), s * (0.7 + rng.randf() * 0.4)))
		mm.set_instance_transform(i, xf)
	multi.multimesh = mm
	add_child(multi)


func _try_tex(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path) as Texture2D
	return null
