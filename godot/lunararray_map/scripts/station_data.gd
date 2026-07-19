extends Node
## Station catalogue — mirrors lib/stations.ts for the Godot map.
## Autoload: StationData

const MAP_OCTO_DEG := 22.0
const MOON_RADIUS := 2.0

## id, name, purpose, tone, angle (deg, null = hub), accent Color
var stations: Array[Dictionary] = [
	{"id": "LA-00", "name": "Sinus Medii", "purpose": "Primary spaceport & deep-space communications relay", "tone": "house", "angle": null, "accent": Color("5cd6ff")},
	{"id": "LA-01", "name": "Serenitatis", "purpose": "Inter-Moon transit hub", "tone": "house", "angle": 0.0, "accent": Color("ffb45c")},
	{"id": "LA-02", "name": "Tranquillitatis", "purpose": "Restricted — military installation", "tone": "military", "angle": 45.0, "accent": Color("8b93a3")},
	{"id": "LA-03", "name": "Nectaris", "purpose": "Mining", "tone": "house", "angle": 90.0, "accent": Color("ffd75c")},
	{"id": "LA-04", "name": "Fecunditatis", "purpose": "Manufacturing & communications", "tone": "house", "angle": 135.0, "accent": Color("7cffc4")},
	{"id": "LA-05", "name": "Nubium", "purpose": "Restricted — military installation", "tone": "military", "angle": 180.0, "accent": Color("a3b0c8")},
	{"id": "LA-06", "name": "Humorum", "purpose": "Foundation — restricted", "tone": "foundation", "angle": 225.0, "accent": Color("d8c8a8")},
	{"id": "LA-07", "name": "Procellarum", "purpose": "City expansion zone", "tone": "house", "angle": 270.0, "accent": Color("ff8a5c")},
	{"id": "LA-08", "name": "Imbrium", "purpose": "City — residential core", "tone": "house", "angle": 315.0, "accent": Color("c48aff")},
]

const ENTERABLE := ["LA-08"]


func get_station(id: String) -> Dictionary:
	for s in stations:
		if s.id == id:
			return s
	return {}


func can_enter(id: String) -> bool:
	return id in ENTERABLE


## lat/lon for map-display scale (exaggerated ring).
func map_lat_lon(s: Dictionary) -> Vector2:
	if s.angle == null:
		return Vector2.ZERO
	return _bearing_point(MAP_OCTO_DEG, float(s.angle))


func lat_lon_to_vec3(lat: float, lon: float, r: float = MOON_RADIUS) -> Vector3:
	var la := deg_to_rad(lat)
	var lo := deg_to_rad(lon)
	return Vector3(
		r * cos(la) * sin(lo),
		r * sin(la),
		r * cos(la) * cos(lo)
	)


func station_world(id: String) -> Vector3:
	var s := get_station(id)
	var ll := map_lat_lon(s)
	return lat_lon_to_vec3(ll.x, ll.y, MOON_RADIUS)


func _bearing_point(radius_deg: float, angle_deg: float) -> Vector2:
	## N = 0°, clockwise. Returns Vector2(lat, lon) in degrees.
	var a := deg_to_rad(angle_deg)
	var lat := radius_deg * cos(a)
	var lon := radius_deg * sin(a)
	return Vector2(lat, lon)
