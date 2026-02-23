{
    "eyeLocations": [[0,0,0]],
    "lookat": [0, 0, 5],
    "up": [0,1,0],
    "fov_angle": 50,
    "width": 200,
    "height": 200,
    "DefaultColor":[0,0,0],
    "SunLocation":[-900,900,-50],
    "spheres": [
	{
        "type": "sphere",
        "center": [0.25,0.25,2.5],
        "radius": 0.25,
        "ambient": [0.09, 0.99,0.09]
    },
	{
        "type": "sphere",
        "center": [0.05,0.05,2.25],
        "radius": 0.25,
        "ambient": [0.99, 0.09,0.09]
    }
	],
    "billboards": [
	 {
        "type":"billboards",
		"LowerLeft": [-1 , -1, 3], 
        "UpperLeft": [-1, 1 , 3], 
        "UpperRight": [1 , 1, 3],
        "filename": "world_map.png"
    },
	 {
        "type":"billboards",
		"LowerLeft": [-0.5 , -0.5, 2.20], 
        "UpperLeft": [-0.5, 0.5 , 2.20], 
        "UpperRight": [0.5 , 0.5, 2.20],
        "filename": "chessboard.png"
    }
	]
}
