extends Node3D
## LA-08 Imbrium — residential core: park dome, towers, sunlight pods, enter portal.

const ACCENT := Color("c48aff")
const WARM := Color("ffd9a0")
const PARK := Color("9be8b0")
const HULL := Color("eef2f7")

@onready var towers: Node3D = $Towers
@onready var pods: Node3D = $SunlightPods
@onready var domes: Node3D = $Domes
@onready var portal: Area3D = $Portal


func _ready() -> void:
	_build_towers()
	_build_pods()
	_build_domes()
	if portal:
		portal.input_event.connect(_on_portal_input)


func _build_towers() -> void:
	var specs := [
		Vector3(0, 0, -14), Vector3(11, 0, -9), Vector3(15, 0, 2),
		Vector3(10, 0, 12), Vector3(-2, 0, 15), Vector3(-12, 0, 10),
		Vector3(-16, 0, -1), Vector3(-10, 0, -11), Vector3(20, 0, -6), Vector3(-20, 0, 7),
	]
	var heights := [17.0, 13.0, 10.0, 12.0, 9.0, 13.5, 11.0, 14.5, 7.5, 8.0]
	var radii := [3.0, 2.4, 2.2, 2.4, 2.0, 2.5, 2.2, 2.6, 1.7, 1.8]
	for i in specs.size():
		var mi := MeshInstance3D.new()
		var mesh := CapsuleMesh.new()
		mesh.radius = radii[i]
		mesh.height = heights[i]
		mi.mesh = mesh
		mi.position = specs[i] + Vector3(0, heights[i] * 0.5, 0)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = HULL
		var tex := _tex("res://assets/textures/hull-panel.jpg")
		if tex:
			mat.albedo_texture = tex
		mat.metallic = 0.35
		mat.roughness = 0.4
		mat.emission_enabled = true
		mat.emission = WARM * 0.15
		mi.material_override = mat
		towers.add_child(mi)


func _build_pods() -> void:
	var count := 12
	var radius := 30.0
	for i in count:
		var a := (float(i) / count) * TAU + 0.12
		var pod := _make_pod()
		pod.position = Vector3(cos(a) * radius, 0.0, sin(a) * radius)
		pod.rotation.y = -a + PI / 2.0
		pods.add_child(pod)


func _make_pod() -> Node3D:
	var root := Node3D.new()
	var mast := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.06
	cyl.bottom_radius = 0.12
	cyl.height = 2.2
	mast.mesh = cyl
	mast.position.y = 1.1
	var metal := StandardMaterial3D.new()
	metal.albedo_color = Color("c8ccd8")
	metal.metallic = 0.7
	metal.roughness = 0.3
	mast.material_override = metal
	root.add_child(mast)
	var head := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = 0.55
	sph.height = 1.1
	head.mesh = sph
	head.position.y = 2.85
	head.scale = Vector3(1.0, 1.35, 0.72)
	var glass := StandardMaterial3D.new()
	glass.albedo_color = Color("f2e8ff")
	var ptex := _tex("res://assets/textures/sunlight-pod.jpg")
	if ptex:
		glass.albedo_texture = ptex
	glass.metallic = 0.2
	glass.roughness = 0.18
	glass.emission_enabled = true
	glass.emission = WARM
	glass.emission_energy_multiplier = 0.4
	glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	glass.albedo_color.a = 0.88
	head.material_override = glass
	root.add_child(head)
	return root


func _build_domes() -> void:
	# Central park dome
	_add_dome(Vector3.ZERO, 9.5, true)
	# Outer ring
	for i in 8:
		var a := (float(i) / 8.0) * TAU + 0.3
		var r := 2.1 + fmod(float(i) * 0.37, 1.4)
		_add_dome(Vector3(cos(a) * 26.0, 0.0, sin(a) * 26.0), r, false)


func _add_dome(pos: Vector3, r: float, is_park: bool) -> void:
	var group := Node3D.new()
	group.position = pos
	# Vegetation disc under glass
	var garden := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = r * 0.9
	disc.bottom_radius = r * 0.9
	disc.height = 0.08
	garden.mesh = disc
	garden.position.y = 0.05
	var gmat := StandardMaterial3D.new()
	var gtex := _tex("res://assets/textures/dome-vegetation.jpg")
	if gtex:
		gmat.albedo_texture = gtex
	else:
		gmat.albedo_color = PARK
	gmat.roughness = 0.9
	garden.material_override = gmat
	group.add_child(garden)
	# Glass dome (hemisphere approx via scaled sphere)
	var dome := MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = r
	sph.height = r * 2.0
	sph.is_hemisphere = true
	dome.mesh = sph
	dome.position.y = 0.0
	dome.scale.y = 0.5
	var dmat := StandardMaterial3D.new()
	dmat.albedo_color = Color(0.82, 0.96, 0.85, 0.38)
	var dtex := _tex("res://assets/textures/dome-glass.jpg")
	if dtex:
		dmat.albedo_texture = dtex
	dmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	dmat.metallic = 0.08
	dmat.roughness = 0.12
	dmat.emission_enabled = true
	dmat.emission = PARK * 0.3
	dome.material_override = dmat
	group.add_child(dome)
	if is_park:
		var light := OmniLight3D.new()
		light.light_color = PARK
		light.light_energy = 4.0
		light.omni_range = 22.0
		light.position.y = 5.0
		group.add_child(light)
	domes.add_child(group)


func _on_portal_input(_cam: Node, event: InputEvent, _pos: Vector3, _n: Vector3, _i: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var main := get_tree().current_scene
		if main and main.has_node("CameraRig"):
			var rig = main.get_node("CameraRig")
			if rig.has_method("enter_interior"):
				rig.enter_interior()


func _tex(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path) as Texture2D
	return null
