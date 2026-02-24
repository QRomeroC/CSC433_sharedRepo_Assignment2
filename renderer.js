/*
Authors: Cesar Quihuis-Romero & Aaron Posey
CS533, Homework 2
23 February 2025
Extend this header for your submission
Feel free to change this file and add/remove variables and functions
Template author: Amir Mohammad Esmaieeli Sikaroudi
*/

//All HTML (GUI) components and globals
var canvas = document.getElementById('canvas');
var input = document.getElementById("load_scene");
var saveButton = document.getElementById("save_scene_picture");
var saveGIFButton = document.getElementById("save_gif");

input.addEventListener("change", readSceneMaterial);

saveButton.addEventListener("click", writeScene);
saveGIFButton.addEventListener("click", createGif);

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var scenes = [];
var newSceneReq = false;//not implamented since not interperlating two camera points
var renderedOnce = false;//may depercate, was worried about shooting rays after render
var currentScene;//Current rendering scene
var testAmbient;

//debug flag
const debug_mode = false;
const single_test = true;
const single_shot = false;

/*
======================================================================================================
				--------------------Start of class declarations------------------
======================================================================================================
*/

/*
=========================================================================================================
	Name: Billboard
	Purpose: class representing a billboard, takes 4 vec3 coords for LL,UL,UR,LR.
	        calculates U,V for hit detection. Also takes a file name and Image object.
	Arguments: Constructor expects:
				LL,UL,UR,LR - Vector3 objects with coordinates for corners
				imgFile - a string that represents the file name of the image mapped to bb
				img - an Image object with parts: 
					readImageValues - a flat array of RGBAValue objects (shape RIV.r,RIV.g,RIV.b,RIV.a)
					width - integer that represents width of billboard
					height - integer that represents height of billboard
					fileName - string that represents the file name of the image
	Returns: N/A - used in the construction of billboard objects during scene parsing
========================================================================================================
*/
class Billboard {
	constructor(LowerLeft,UpperLeft,UpperRight,LowerRight,imgFile,img){
		this.LowerLeft=LowerLeft;
		this.UpperLeft=UpperLeft;
		this.UpperRight=UpperRight;
		this.LowerRight=LowerRight;
		this.imgFile=imgFile;
		this.img=img;
		//edgeU = x-axis
		this.edgeU = Vector3.minusTwoVectors(this.LowerRight, this.LowerLeft);
		//edgeV = y-axis
		this.edgeV = Vector3.minusTwoVectors(this.UpperLeft, this.LowerLeft);
		//w = width
		this.w = Vector3.getMagnitude(this.edgeU);	
		if (debug_mode)console.log("w : ", this.w);
		//h = height
		this.h = Vector3.getMagnitude(this.edgeV);
		if (debug_mode)console.log("h : ", this.h);
		//U,V are normalized unit vectors along x and y axis
		this.U = Vector3.multiplyVectorScalar(this.edgeU, 1.0 / this.w);
		this.V = Vector3.multiplyVectorScalar(this.edgeV, 1.0 / this.h);
		if (debug_mode)console.log("U :", this.U);
		if (debug_mode)console.log("V :", this.V);
	}
}//end of billboard class



/*
========================================================================================================
	Name: Sphere
	Purpose: class representing a shpere. takes a single vec3 for center point,
			a float that represents the radius, and a RGBAValue array having converted
			3 float values into there RGBA Values.
	Arguments: Constructor expects:
				center - Vector3 with C[0],C[1],C[2] parsed from json
				radius - float representing radius of Sphere
				amb - a RGBAValue array with values converted from floats ([0.00,0.00,0.00]->[r,g,b,a])
	Return: N/A - used in the construction of sphere objects during scene parsing
========================================================================================================
*/
class Sphere {
	constructor(center,radius,ambient){
		this.center=center;
		this.radius=radius;
		this.amb = ambient;
	}
}//end of Sphere class


/*
========================================================================================================
	Name: Vector3
	Purpose: class representing a 3d vector. Takes a 3d point x,y,z vals. Offers a library to do basic 
			 vector math i.e. add, subtract, multiply, dot and cross product with vectors
	
	Arguments: Constructor expects:
				x value on the x-Axis in 3d space
				y value on the x-Axis in 3d space
				z value on the x-Axis in 3d space
				
	Return: N/A - used in the construction of sphere objects during scene parsing
========================================================================================================
*/

class Vector3{
	constructor(x,y,z){
		this.x=x;
		this.y=y;
		this.z=z;
	}
	static multiplyVectorScalar(vec,scalar){
		return new Vector3(vec.x*scalar,vec.y*scalar,vec.z*scalar);
	}
	static sumTwoVectors(vec1,vec2){
		return new Vector3(vec1.x+vec2.x,vec1.y+vec2.y,vec1.z+vec2.z);
	}
	static minusTwoVectors(vec1,vec2){
		return new Vector3(vec1.x-vec2.x,vec1.y-vec2.y,vec1.z-vec2.z);
	}
	static normalizeVector(vec){
		let sizeVec=Math.sqrt(Math.pow(vec.x,2)+Math.pow(vec.y,2)+Math.pow(vec.z,2));
		return new Vector3(vec.x/sizeVec,vec.y/sizeVec,vec.z/sizeVec);
	}
	static crossProduct(vec1,vec2){
		return new Vector3(vec1.y * vec2.z - vec1.z * vec2.y,vec1.z * vec2.x - vec1.x * vec2.z,vec1.x * vec2.y - vec1.y * vec2.x);
	}
	static negate(vec){
		return new Vector3(-vec.x,-vec.y,-vec.z);
	}
	static dotProduct(vec1,vec2){
		var result = 0;
		result += vec1.x * vec2.x;
		result += vec1.y * vec2.y;
		result += vec1.z * vec2.z;
		return result;
	}
	static distance(p1,p2){
		return Math.sqrt(Math.pow(p1.x-p2.x,2)+Math.pow(p1.y-p2.y,2)+Math.pow(p1.z-p2.z,2));
	}
	static getMagnitude(vec){
		return Math.sqrt(Math.pow(vec.x,2)+Math.pow(vec.y,2)+Math.pow(vec.z,2));
	}
}//end of Vector3 class

/*
========================================================================================================
	Name: RGBAValue
	Purpose: Store RGBa pixel values to easily access rgba values 
	Arguments: Constructor expects:
				r value - red componet of a pixel
				g value - green componet of a pixel
				b value - blue componet of a pixel
				a value - transparency component of a pixel
				
	Return: N/A - used in the construction of sphere objects during scene parsing
========================================================================================================
*/
//RGBAValue class given - used to assign Red,Green,Blue,Alpha values
class RGBAValue{
	constructor(r,g,b,a)
	{
		this.r=r;
		this.g=g;
		this.b=b;
		this.a=a;
	}
}//end of RGBAValue class


/*
*****************************************************************************************
	Name: makeImagePlane
	Purpose: used during camera object construction. uses camera fields/members to
			construct a image plane at distance D from camera eye
	Arguments: 
			eye - Vector3 coordaniate for camera eye
			forward - normalzied vector representing the foward direction of eye
			right - normalized vector representing the right direction of eye
			up - normalized vector representing the up direction of eye, not worldUp
			dist - float that represents the distance from eye based on FOV of camera eye
			halfWidth,halfHeight - floats that represent half values of the image plane
	Return: image plane object - shape {center:center,LL:LL,UL:UL,UR:UR,LR:LR,dist:dist}
******************************************************************************************	
*/
function makeImagePlane(eye,forward,right,up,dist,halfWidth,halfHeight){
	
	let center = Vector3.sumTwoVectors(eye, Vector3.multiplyVectorScalar(forward,dist));
	
	let upPart = Vector3.multiplyVectorScalar(up,halfHeight);
	let rightPart = Vector3.multiplyVectorScalar(right,halfWidth);
	//build corners from "U/Right Component" and "V/Up Component"
	let LL = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,Vector3.negate(upPart)),Vector3.negate(rightPart));
	let UL = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,upPart),Vector3.negate(rightPart));
	let UR = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,upPart),rightPart);
	let LR = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,Vector3.negate(upPart)),rightPart);
	//return image plane struct/object with center, 4 corners, and distance
	return { center: center, LL: LL, UL: UL, UR: UR, LR: LR, dist: dist };
}//end of makeImagePlane() function.

/*
========================================================================================================
	Name: Camera
	Purpose: class representing a camera. takes...
	Arguments: Constructor expects:
				eye - Vec3 object with coordaniate (eye[0],eye[1],eye[2])
				lookAt - Vec3 object with coords (lookat[0],lookat[1],lookat[2])
				worldUp - Vec3 object with coords (up[0],up[1],up[2])
				fov - integer representing the field of view (degrees)
				width - integer repesenting width of image plane
				height - integer representing height of image plane
				backgroundColor - a RGBAValue object (JSON.bgColor[0],JSON.bgColor[1],JSON.bgColor[2],255)
				
				constructor generates:
				bitmap - bitmap[x==height][y==width] - maps bg.r,bg.g,bg.b,255
				foward - normalized vector calculated in buildBases() - represents foward of eye
				right - normalized vector calculated in buildBases() - represents right of eye
				trueUp - normalized vector calculated in buildBases() - represents up of eye (differ from worldUp)
				fovRad - field of view in radians
				halfHeight - half of image plane height (expected 1) 
				halfWidth - half of image plane width (same as height)
				planeDist - calculated from half trangle made from eye and fov
				imagePlane - the image plane object given by makeImagePlane()
					shape({center:center,LL:LL,UL:UL,UR:UR,LR:LR,dist: dist}
				
				class functions:
				buildBasis() - uses 
				
				generateRay()
				
	Return: N/A - used in the construction of camera objects during scene parsing and to generate rays for camera
========================================================================================================
*/
class Camera{//This object stores camera vectors
	constructor(eye, lookAt, up, fovDeg, width, height, sunLocation, backgroundColor){
		this.eye = eye;
		this.lookAt = lookAt;
		this.worldUp = up;
		this.fov = fovDeg;
		this.width = width;
		this.height = height;
		this.sunLocation = sunLocation
		this.backgroundColor = backgroundColor || new RGBAValue(0,0,0,255);
		
		//bitmap declaration and background mapping
		this.bitmap = [];
		for (let x = 0; x < width; x++){
			this.bitmap[x] = [];
			for (let y = 0; y < height; y++){
				this.bitmap[x][y] = new RGBAValue(
					this.backgroundColor.r,
					this.backgroundColor.g,
					this.backgroundColor.b,
					255
				);
			}
		}
		//calculate the camera basis (foward,right,up)
		this.buildBasis();

		//get fov in radians
		let fovRad = (this.fov * Math.PI) / 180.0;
		
		//half is 1 since image plane width/height should be 2 across
		let halfHeight = 1.0;
		let halfWidth = 1.0;
		
		//distance d is 1/tan(half of theta in radians)
		this.planeDist = halfHeight / Math.tan(fovRad / 2.0);
		
		//generate the image plane with camera specs
		this.imagePlane = makeImagePlane(this.eye, this.forward, this.right, this.trueUp,
										this.planeDist, halfWidth, halfHeight);
		
		if (debug_mode)console.log("imagePlane(LL): ",this.imagePlane.LL);
		if (debug_mode)console.log("imagePlane(UL): ",this.imagePlane.UL);
		if (debug_mode)console.log("imagePlane(UR): ",this.imagePlane.UR);
		if (debug_mode)console.log("imagePlane(LR): ",this.imagePlane.LR);
		
	}

	/*
	*****************************************************************************************
	Name: buildBasis
	Purpose: Calculates the camera basis including forward, right and trueUp
	Arguments: None
	Return: Nothing
	******************************************************************************************	
	*/
	buildBasis(){
		//w,u,v (not to be confused with billboard w,u,v)
		this.forward = Vector3.normalizeVector(Vector3.minusTwoVectors(this.lookAt, this.eye));
		//this.right = Vector3.normalizeVector(Vector3.crossProduct(this.forward, this.worldUp));
		this.right = Vector3.normalizeVector(Vector3.crossProduct(this.worldUp,this.forward));
		//this.trueUp = Vector3.normalizeVector(Vector3.crossProduct(this.right, this.forward));
		this.trueUp = Vector3.normalizeVector(Vector3.crossProduct(this.forward,this.right));
	}
	
	/*
	*****************************************************************************************
	Name: generateRay
	Purpose: class function that for a given pixel (x,y) generate a new 
		     ray object with a origin at eye and direction calculated from point p - eye
	Arguments: None
	Return: Nothing
	******************************************************************************************	
	*/
	generateRay(pixelX, pixelY){
		let w = this.width;
		let h = this.height;
		
		let u = (pixelX + 0.5) / w;
		let v = (pixelY + 0.5) / h;
		
		//point = UL + u(UR-UL) + v(LL-UL)
		let LL = this.imagePlane.LL;
		let UL = this.imagePlane.UL;
		let UR = this.imagePlane.UR;
		
		let horiz = Vector3.minusTwoVectors(UR,UL);
		let vert = Vector3.minusTwoVectors(LL,UL);
		
		
		let p = Vector3.sumTwoVectors(
			UL,
			Vector3.sumTwoVectors(
				Vector3.multiplyVectorScalar(horiz,u),
				Vector3.multiplyVectorScalar(vert, v)
			)
		);
		
		let dir = Vector3.minusTwoVectors(p,this.eye);
		//ray has an origin and direction
		return new Ray(this.eye, dir);
	}
}

/*
========================================================================================================
	Name: Scene
	Purpose: class that stores a complete scene including camera, sphere list, and billboard list.
	Arguments: Constructor expects:
				camera - Camera object with render settings and bitmap
				spheres - array of Sphere objects for ray intersections
				billboards - array of Billboard objects for textured quads
	Return: N/A - used as the top-level parsed scene container
========================================================================================================
*/
class Scene{//This object stores everything required for a scene
	constructor(camera,spheres,billboards){
		this.camera = camera;
		this.spheres = spheres || [];
		this.billboards = billboards || [];
	}
}

/*
========================================================================================================
	Name: Image
	Purpose: class that stores parsed image pixel data and dimensions for billboard texturing.
	Arguments: Constructor expects:
				data - flat array of RGBAValue pixels
				width - integer width of image
				height - integer height of image
				fileName - string name of original image file
	Return: N/A - used for matching files to scene billboards
========================================================================================================
*/
class Image{//This object stores image data
	constructor(data,width,height,fileName){
		this.data=data;
		this.fileName=fileName;
		this.width=width;
		this.height=height;
	}
}

/*
========================================================================================================
	Name: Ray
	Purpose: class that stores a normalized ray with origin and direction for ray casting.
	Arguments: Constructor expects:
				origin - Vector3 start point of the ray
				direction - Vector3 direction of the ray (normalized in constructor)
	Return: N/A - used by camera ray generation and intersection tests
========================================================================================================
*/
class Ray{
	constructor(origin, direction){
		this.origin = origin;
		this.direction = Vector3.normalizeVector(direction);
	}
	at(t){
		return Vector3.sumTwoVectors(this.origin,Vector3.multiplyVectorScalar(this.direction, t));
	}
}

var filesToRead=[];//List of files to be read

var imageData=[];//The image contents are stored separately here
var doneLoading=false;//Checks if the scene is done loading to prevent renderer draw premuturly.

/*
========================================================================================================
	Name: drawScene
	Purpose: main render loop that waits for async file loading, then renders each frame.
	Arguments: None
	Return: N/A - updates canvas by calling ray shooting and schedules the next frame
========================================================================================================
*/
function drawScene() {
	if(doneLoading==false)
	{
		var isReaminingRead=false;
		for(let j=0;j<filesToRead.length;j++)
		{
			if(filesToRead[j]==true)//Check if each file is read
			{
				isReaminingRead=true;//If one is not read, then make sure drawing scene will wait for files to be read
			}
		}
		if(isReaminingRead==false)//If all files are read
		{
			assignImagesToScenes();//Assign the read images to the billboards inside the scenes

			document.getElementById("canvas").setAttribute("width",currentScene.camera.width);
			document.getElementById("canvas").setAttribute("height",currentScene.camera.height);

			doneLoading=true;
		}
	}else if(doneLoading==true)//If scene is completely read
	{
		// Rendering can start here
		shootRays();
	}

	// Call drawScene again next frame with delay to give user chance of interacting HTML GUI
	setTimeout(function() { requestAnimationFrame(drawScene)}, 1000);

}


//GIF Vars
var gifT=0;// The animation time that is between 0 and 1
var encoder;// The encoder to save GIF file
var gifFrame = 0;
var gifTotalFrames = 30;

/*
========================================================================================================
	Name: createGif
	Purpose: initializes GIF encoder settings and starts frame-by-frame GIF rendering.
	Arguments: None
	Return: N/A - starts asynchronous GIF frame capture loop
========================================================================================================
*/
function createGif(){
  if (!doneLoading){
    console.warn("Scene not loaded yet.");
    return;
  }

  const camera = currentScene.camera;

  // Use your scene resolution (or set smaller for faster GIFs)
  document.getElementById("canvas").setAttribute("width", camera.width);
  document.getElementById("canvas").setAttribute("height", camera.height);

  gifFrame = 0;

  encoder = new GIFEncoder();
  encoder.setRepeat(0);
  encoder.setDelay(100); // 10 fps
  encoder.start();

  testCreateGIFLoop();
}


/*
========================================================================================================
	Name: testCreateGIFLoop
	Purpose: animates camera position across frames, renders each frame, and writes to GIF.
	Arguments: None
	Return: N/A - finishes by downloading rendered GIF file
========================================================================================================
*/
function testCreateGIFLoop(){
  if (gifFrame < gifTotalFrames){

    const camera = currentScene.camera;

    // t in [0,1]
    const t = gifFrame / (gifTotalFrames - 1);

    // Example animation: orbit camera around origin
    const radius = 10;
    const angle = t * Math.PI * 2;
    camera.eye = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    camera.lookAt = new Vector3(0, 0, 0);

    // Rebuild camera basis + image plane (critical!)
    camera.buildBasis();

    const fovRad = (camera.fov * Math.PI) / 180.0;
    const halfHeight = 1.0;
    const halfWidth = (camera.width / camera.height) * halfHeight;
    camera.planeDist = halfHeight / Math.tan(fovRad / 2.0);
    camera.imagePlane = makeImagePlane(
      camera.eye, camera.forward, camera.right, camera.trueUp,
      camera.planeDist, halfWidth, halfHeight
    );

    // Render this frame
    shootRays();          // fills camera.bitmap and draws to canvas
    encoder.addFrame(ctx);

    gifFrame++;

    // Schedule next frame
    setTimeout(() => requestAnimationFrame(testCreateGIFLoop), 0);

  } else {
    encoder.finish();
    encoder.download("renderedScene.gif");
  }
}


/*
========================================================================================================
	Name: shootSingleCenterRay
	Purpose: debugging helper that casts one center ray and draws a cross marker on hit color.
	Arguments: None
	Return: N/A - writes debug cross to camera bitmap and updates canvas
========================================================================================================
*/
function shootSingleCenterRay(){
	if (debug_mode)console.log("single ray");
	let camera = currentScene.camera;
	
	if (debug_mode)console.log("camera", camera);
	if (debug_mode)console.log("camera eye: ", camera.eye);
	
	let cx = Math.floor(camera.width/2);
	let cy = Math.floor(camera.height/2);
	
	let ray = camera.generateRay(cx,cy);
	let color = findRayCollisionColor(ray);
	//write to display a target Cross should see 
	for (let dy = -3; dy <= 3; dy++){
		let y = cy + dy;
		if (y >= 0 && y < camera.height){
			camera.bitmap[cx][y] = color;
		}
	}
	for (let dx = -3; dx <= 3; dx++){
		let x = cx + dx;
		if (x >= 0 && x < camera.width){
			camera.bitmap[x][cy] = color;
		}
	}
	drawBitmapToCanvas();
}

/*
========================================================================================================
	Name: shootRays
	Purpose: casts one ray per pixel and fills camera bitmap with collision colors.
	Arguments: None
	Return: N/A - writes render results to bitmap and displays to canvas
========================================================================================================
*/
function shootRays()//This function shoots rays
{
	let camera = currentScene.camera;
	
	for (let y = 0; y < camera.height; y++){
		for (let x = 0; x < camera.width; x++){
			let ray = camera.generateRay(x,y);
			let color = findRayCollisionColor(ray);
			camera.bitmap[x][y] = color;
		}
	}
	
	drawBitmapToCanvas();
}

/*
========================================================================================================
	Name: findRayCollisionColor
	Purpose: finds nearest ray hit among billboards and spheres, then returns final pixel color.
	Arguments:
			ray - Ray object generated from camera for one pixel
	Return: RGBAValue color of closest intersection, or blue background when no hit is found
========================================================================================================
*/
function findRayCollisionColor(ray)//Get color from ray casting
{
	let candidateT = Infinity;
	let candidateColor = null;
	let candidateType = null;
	
	//billboards
	for (let i = 0; i < currentScene.billboards.length; i++){
		//if (debug_mode)console.log("checking hit");
		let hit = getBillboardHit(currentScene.billboards[i],ray);
		if (debug_mode)console.log("hit: ",hit);
		if (hit && hit.t < candidateT){
			candidateT = hit.t;
			candidateColor = hit.color;
			candidateType = "billboard";
		}
	}
	
	//spheres
	for (let i = 0; i < currentScene.spheres.length; i++){
		let currSphere = currentScene.spheres[i];
		let t = getSphereRayCollisionPoint(currSphere, ray);
		if (t != null && t < candidateT){
			candidateT = t;
			candidateColor = new RGBAValue(currSphere.amb.r, currSphere.amb.g,currSphere.amb.b,currSphere.amb.a);
			difusedValue = getDefused(ray, currSphere, t)

			//Apply diffused power to original rgb values then clamp.
			candidateColor.r = clamp255(candidateColor.r + difusedValue);
			candidateColor.g = clamp255(candidateColor.g + difusedValue);
			candidateColor.b = clamp255(candidateColor.b + difusedValue);
			
			candidateType = "spheres";
		}
	}
	
	if (candidateType == "spheres"){
		//shading calls();
	} else{
		//shading calls();
	}
	
	if (!candidateColor){
		//blue background
		return new RGBAValue(0,0,255,255);
	}
	
	return candidateColor;
}

/*
========================================================================================================
	Name: getDefused
	Purpose: computes diffuse lighting strength at a sphere hit point based on sun direction.
	Arguments:
			ray - Ray object used for current hit test
			currSphere - Sphere object that was intersected
			t - float distance along ray to collision point
	Return: float intensity contribution scaled to 0-255 range (can be negative before clamp)
========================================================================================================
*/
function getDefused(ray, currSphere, t){
	let direction = ray.direction;
	let center = currSphere.center;
	let sunLocation = currentScene.camera.sunLocation;
	
	//vector that goes directly to sphere collision point
	let p =  Vector3.multiplyVectorScalar(direction,t);
	
	//Compute normal on sphere. (center - p) 
	let n = Vector3.normalizeVector(Vector3.minusTwoVectors(center,p));

	//vector from p (point on sphere to sunLocation)
	let v = Vector3.normalizeVector(Vector3.minusTwoVectors(p,sunLocation));
	
	//Dot product. How similar the normal is to the suns plane. 
		//If dot is zero they are perpendicular and no diffusion.  
		// If dot is 1 then facing sun full brightness. If negative then backside of sphere.
	let difused = Vector3.dotProduct(n,v);
	
	//Percent of full diffused. 255 being full power of RGB vals.
	difused = difused * 255;
	
	return difused;
}


/*
========================================================================================================
	Name: getSphereRayCollisionPoint
	Purpose: solves quadratic ray-sphere intersection and returns nearest valid hit distance.
	Arguments:
			input - Sphere object to test
			ray - Ray object to test against sphere
	Return: float t distance for intersection, or null when no valid forward hit exists
========================================================================================================
*/
function getSphereRayCollisionPoint(input,ray)//Get ray sphere collision
{
	//--------------------
	//Steps from Slides
	//--------------------

	// A Ray is : P(t)=Origin+t*DirectionVector --> P(t) = O + tD
		
		// Equation for a sphere is: ∣P−C∣^2=r^2 
	
	// Substitute P in equation above with P(t) since it's a point at a certain  "t"
	  
		//∣(O+tD)−C∣^2=r^2

	// Algebra it a little and rearrange it:
	
		//|(O-C+tD|^2=r^2
	
	// (O-C) is the origin - the center of the sphere to get a vector that goes from sphere to ray origin.
	// For Simplicity we let the new vector OC fill in

		// |(OC+tD|^2=r^2

	// Expand it:

		// (OC + tD)•(OC + tD)= r^2

	// Distribute:

		// OC•OC + OCtD + OCtD + tD^2 = r^2

	// Combine Terms:

		// OC•OC +2(OCtD) +tD^2 = r^2

	// Rearrange into quadratic form (at^2 + bt + c)

		// tD^2 + 2t(OC•D) + OC•OC -r^2
		// ____   _______    __________
		//  |       |            |
		//  v       v            v
		//  a       b            c

	//Solve for roots of "t" using quadratic formula

	//---------------------
	//End Steps from Slides
	//---------------------


	let oc = Vector3.minusTwoVectors(ray.origin, input.center);
	
	let a = Vector3.dotProduct(ray.direction, ray.direction);//1 since normalized?
	let b = 2.0 * Vector3.dotProduct(oc, ray.direction);
	let c = Vector3.dotProduct(oc,oc) - input.radius * input.radius;
	
	let disc = (b*b) - 4*a*c;
	if (disc <0){
		return null;
	}
	//solving quadratic, need to refactor to (c-eye-tr)(c-eye-tr)-r^2=0 form
	let sqrtDisc = Math.sqrt(disc);
	let t1 = (-b - sqrtDisc) / (2.0*a);
	let t2 = (-b + sqrtDisc) / (2.0*a);
	//find t s.t its "nearest"
	let t = null;

	if (t1 >= currentScene.camera.planeDist){
		t = t1;
	} else if (t2 >= currentScene.camera.planeDist){
		t = t2;
	}
	
	return t;
}

/*
========================================================================================================
	Name: getBillboardHit
	Purpose: performs ray-plane hit test for billboard, validates bounds, and samples texture color.
	Arguments:
			bb - Billboard object containing corners, basis vectors, and image data
			ray - Ray object to test
	Return: object shape {t, color} when hit exists, or null when ray misses/invalid pixel
========================================================================================================
*/
function getBillboardHit(bb, ray){

	
	if (!bb.img || !bb.img){
		return null;
	}
	

	if (debug_mode)console.log("entered getBillboardHit");
	if (debug_mode)console.log("bb_imgFile: ",bb.imgFile, "bb_img_filename: ", bb.img.fileName);
	
	let pLL = bb.LowerLeft;
	let pUL = bb.UpperLeft;
	let pUR = bb.UpperRight;
	let pLR = bb.LowerRight;
	//if w and h are too small then bb plane is "edge" on facing the image plane
	if (bb.w <= 0.000001 || bb.h <= 0.000001){
		return null;
	}

	//U-> x-axis and V-> y-axis
	let U = bb.U;
	let V = bb.V
	let n = Vector3.crossProduct(U, V);
	n = Vector3.normalizeVector(n);
	
	//Ray-plane intersect == t = ((pLL - O)*n)/(D*n)
	let denom = Vector3.dotProduct(ray.direction,n);
	if (debug_mode)console.log("denom: ",denom);
	//parallel case
	if (Math.abs(denom) < 0.000001){
		return null;
	}
	
	let t = Vector3.dotProduct(Vector3.minusTwoVectors(pLL,ray.origin),n)/denom;
	if (debug_mode)console.log("t: ",t);
	
	//too close to camera case --- can adjust as needed
	if (t < currentScene.camera.planeDist){
		return null;
	}
	
	let q = ray.at(t);
	if (debug_mode)console.log("q: ",q);
	//q = pLL + alpha*w*U + beta*h*V
	let diff = Vector3.minusTwoVectors(q,pLL);
	if (debug_mode)console.log("diff: ",diff);
	let alpha = Vector3.dotProduct(diff,U)/bb.w;
	if (debug_mode)console.log("alpha: ",alpha);
	let beta = Vector3.dotProduct(diff,V)/bb.h;
	if (debug_mode)console.log("beta: ",beta);
	
	//check inside
	if (alpha < 0 || alpha > 1 || beta < 0 || beta > 1){
		return null;
	}
	
	if (debug_mode)console.log("HIT Values",{denom,t,alpha,beta,q});
	//texture and coordinate Checks
	if (debug_mode)console.log("imageData: ", imageData);
	if (debug_mode)console.log("bb img: ", bb.img);
	
	
	let imgW = bb.img.width;
	let imgH = bb.img.height;
	
	let px = Math.floor(alpha * (imgW - 1));
	let py = Math.floor((1.0 - beta) * (imgH - 1));
	
	//clamp
	if (px < 0){
		px = 0;
	}
	if (px >= imgW){
		px = imgW - 1;
	}
	if (py < 0){
		py = 0;
	}
	if (py >= imgH){
		py = imgH - 1;
	}
	
	let idx = py * imgW + px;
	if (idx < 0 || idx >=bb.img.data.length){
		return null;
	}
	let pixelData = bb.img.data[idx];
	if (debug_mode)console.log("px,py,idx: ", px,py,idx, "pixel: ",pixelData);

	//ignore alphas that are 0 (transparent)
	if (pixelData.a == 0){
		return null;
	}
	
	return { t: t, color: new RGBAValue(pixelData.r, pixelData.g, pixelData.b, 255) };
}

/*
========================================================================================================
	Name: drawBitmapToCanvas
	Purpose: copies camera bitmap RGBA values into canvas ImageData for on-screen display.
	Arguments: None
	Return: N/A - updates canvas pixels with current render buffer
========================================================================================================
*/
function drawBitmapToCanvas(){
	let camera = currentScene.camera;
	let imgData = ctx.createImageData(camera.width, camera.height);
	
	for (let y = 0; y < camera.height; y++){
		for (let x = 0; x < camera.width; x++){
			let pixel = camera.bitmap[x][y];
			let idx = (y * camera.width + x) * 4;
			imgData.data[idx] = pixel.r;
			imgData.data[idx + 1] = pixel.g;
			imgData.data[idx + 2] = pixel.b;
			imgData.data[idx + 3] = 255;
		}
	}
	ctx.putImageData(imgData,0,0);
}

/*
========================================================================================================
	Name: readSceneMaterial
	Purpose: reads selected scene/image files asynchronously and starts render loop when queued.
	Arguments: None - uses files selected by HTML input element
	Return: N/A - populates scene and image storage for rendering
========================================================================================================
*/
function readSceneMaterial()//This is the function that is called after user selects multiple files of images and scenes
{
	if (debug_mode)console.log("entered readSceneMaterial");
	if (input.files.length > 0) {
		if(doneLoading==true)//This condition checks if this is the first time user has selected a scene or not. If doneLoading==true, then the user has selected a new scene while rendering
		{
			newSceneRequested=true;
			filesToRead=[];//List of files to be read
			imageData=[];//The image contents are stored separately here
			scenes=[];//List of scenes
		}
		doneLoading=false;
		for(var i=0;i<input.files.length;i++)
		{
			var file = input.files[i];
			var reader = new FileReader();
			filesToRead[i]=true;
			reader.onload = (function(f,index) {
				return function(e) {
					//Get the file name
					fileName = f.name;
					if (debug_mode)console.log(fileName);
					//Get the file Extension 
					fileExtension = fileName.split('.').pop();
					if(fileExtension=='ppm')
					{
						var file_data = this.result;
						let img=parsePPM(file_data,fileName);//Parse image
						imageData.push(img);
						filesToRead[index]=false;//Javascript does not immediately read the files. It starts to read only when the function returns. A list of "to be read files" is required.
					}else if(fileExtension=='js')
					{
						var file_data = this.result;
						scenes.push(parseScene(file_data));//Parse scene
						filesToRead[index]=false;//Javascript does not immediately read the files. It starts to read only when the function returns. A list of "to be read files" is required.
					}else if(fileExtension=='png')
					{
						var file_data = this.result;

						var pngImage = new PNGReader(file_data);

						pngImage.parse(function(err, png){
							if (err) throw err;
							//if (debug_mode)console.log(png);
							let img = parsePNG(png,fileName);
							if (debug_mode)console.log("image: ", img);
		
							imageData.push(img);
							filesToRead[index]=false;//Javascript does not immediately read the files. It starts to read only when the function returns. A list of "to be read files" is required.
						});
					}
				};
			})(file,i);
			let fileName = file.name;
			let fileExtension = fileName.split('.').pop();
			if(fileExtension=='ppm' || fileExtension=='js' || fileExtension=='json')
			{
				reader.readAsBinaryString(file);
			}else if(fileExtension=='png'){
				reader.readAsArrayBuffer(file);
			}
		}
		drawScene();//Enter the drawing loop
	}
}

/*
========================================================================================================
	Name: assignImagesToScenes
	Purpose: matches parsed images to billboards by file name and sets active scene reference.
	Arguments: None
	Return: N/A - updates scene billboard image pointers and currentScene global
========================================================================================================
*/
function assignImagesToScenes()
{
	for (let s = 0; s < scenes.length; s++){
		let currScene = scenes[s];
		if(!currScene){
			continue;
		}
		for (let b = 0; b < currScene.billboards.length; b++){
			let bb = currScene.billboards[b];
			if (!bb.imgFile){
				continue;
			}
			
			for (let i = 0; i < imageData.length; i++){
				if (imageData[i].fileName == bb.imgFile){
					bb.img = imageData[i];
					break;
				}
			}

			if(!bb.img){
				console.warn("BB Imagae not loaded: ", bb.imgFile, "Make sure to pick this png in the file selection process.");
			}
		}
	}
	if (scenes.length > 0){
		currentScene = scenes[0];
	}
}

/*
========================================================================================================
	Name: clamp255
	Purpose: clamps numeric color channel value into valid [0,255] range.
	Arguments:
			x - numeric color channel value
	Return: integer-like numeric value constrained between 0 and 255
========================================================================================================
*/
function clamp255(x){
	if (x < 0) return 0;
	if (x > 255) return 255;
	return x;
}

/*
========================================================================================================
	Name: floatColorToRGBA
	Purpose: converts normalized float RGB [0..1] array into RGBAValue [0..255].
	Arguments:
			arr - float array [r,g,b] where each value is expected between 0 and 1
	Return: RGBAValue object with alpha fixed to 255
========================================================================================================
*/
function floatColorToRGBA(arr){
	let r = clamp255(Math.round(arr[0] * 255));
	let g = clamp255(Math.round(arr[1] * 255));
	let b = clamp255(Math.round(arr[2] * 255));
	return new RGBAValue(r,g,b,255);
}

/*
========================================================================================================
	Name: parseScene
	Purpose: parses scene JSON content and constructs Camera, Sphere, and Billboard objects.
	Arguments:
			file_data - string JSON text read from selected scene file
	Return: Scene object populated with parsed camera, geometry, and billboard metadata
========================================================================================================
*/
function parseScene(file_data)//A function to read JSON and put the data inside a scene class
{
	let text = file_data;
	let obj = null;
	
	try{
		obj = JSON.parse(text);
	} catch(err){
		if (debug_mode)console.log("JSON parse failed", err);
		if (debug_mode)console.log("scene text snippet:", text.substring(0,200));
		return null;
	}
	
	if (debug_mode)console.log(obj);
	let eye = [0,0,5];
	if (obj.eyeLocations && obj.eyeLocations.length >0){
		eye = obj.eyeLocations[0];
	}
	if (debug_mode)console.log(eye);
	let lookat = obj.lookat;
	if (debug_mode)console.log(lookat);
	let up = obj.up;
	if (debug_mode)console.log(up);
	let fov = obj.fov_angle;
	if (debug_mode)console.log(fov);
	let width = obj.width;
	if (debug_mode)console.log(width);
	let height = obj.height;
	if (debug_mode)console.log(height);
	let sunLocation = obj.SunLocation || obj.sunLocation;
	
	let bgArr = obj.DefaultColor || obj.DefaulColor;
	if (debug_mode)console.log(bgArr);
	let bgColor = new RGBAValue(bgArr[0],bgArr[1],bgArr[2],255);
	if (debug_mode)console.log(bgColor);
	
	let camera = new Camera(
		new Vector3(eye[0], eye[1], eye[2]),
		new Vector3(lookat[0], lookat[1], lookat[2]),
		new Vector3(up[0], up[1], up[2]),
		fov,
		width,
		height,
		new Vector3(sunLocation[0],sunLocation[1],sunLocation[2]),
		bgColor
	);
	if (debug_mode)console.log("camera = ",camera);
	if (debug_mode)console.log("imagePlane(LL): ",camera.imagePlane.LL);
	if (debug_mode)console.log("imagePlane(UL): ",camera.imagePlane.UL);
	if (debug_mode)console.log("imagePlane(UR): ",camera.imagePlane.UR);
	if (debug_mode)console.log("imagePlane(LR): ",camera.imagePlane.LR);
	
	let spheres = [];
	let sphereList = obj.spheres || [];
	for (let i = 0; i < sphereList.length; i++){
		let currSphere = sphereList[i];
		if (debug_mode)console.log("currSphere: ",currSphere);
		if (!currSphere){
			continue;
		}
		
		let center = currSphere.center;
		let radius = currSphere.radius;
		let amb = currSphere.ambient;
		let color = floatColorToRGBA(amb);
		
		spheres.push(new Sphere(
			new Vector3(center[0],center[1],center[2]),
			radius,
			color
		));
	}
	if (debug_mode)console.log("spheres: ",spheres);
	
	let billboards = [];
	let bbList = obj.billboards || [];
	for (let i = 0; i < bbList.length; i++){
		let currBB = bbList[i];
		if (debug_mode)console.log("currBB: ",currBB);
		if (!currBB){
			continue;
		}
		
		let LL = currBB.LowerLeft || currBB.lowerLeft || currBB.ll;
		let UL = currBB.UpperLeft || currBB.upperLeft || currBB.ul;
		let UR = currBB.UpperRight || currBB.upperRight || currBB.ur;
		let imgFile = currBB.filename || currBB.imgFile || "";
		
		if(!LL || !UL || !UR){
			continue;
		}
		
		let LLv = new Vector3(LL[0],LL[1],LL[2]);
		let ULv = new Vector3(UL[0],UL[1],UL[2]);
		let URv = new Vector3(UR[0],UR[1],UR[2]);
		
		//LR = LL + UR - UL
		let LRv = Vector3.sumTwoVectors(LLv,Vector3.minusTwoVectors(URv,ULv));
		
		billboards.push(new Billboard(
			LLv,ULv,URv,LRv,
			imgFile,
			null
			//parsePNG(imgFile,imgFile)
		));
	}
	if (debug_mode)console.log(billboards);
	return new Scene(camera,spheres,billboards);
}

/*
========================================================================================================
	Name: parsePNG
	Purpose: converts decoded PNG object data into internal Image class format.
	Arguments:
			png - parsed PNG object from PNGReader
			fileName - source image file name string
	Return: Image object containing RGBAValue pixels and dimensions
========================================================================================================
*/
function parsePNG(png,fileName){
	
	let rawValues = png.getRGBA8Array();
	let width = png.getWidth();
	let height = png.getHeight();
	var readImageValues=[];//Array of RGBA instances
	var counterMain=0;//It is used for array of RGBAValue instances.
	for(var i = 0; i < rawValues.length; i++){
		let r=rawValues[i*4];
		let g=rawValues[i*4+1];
		let b=rawValues[i*4+2];
		let a=rawValues[i*4+3];
		readImageValues[counterMain]=new RGBAValue(r,g,b,a);
		counterMain=counterMain+1;
	}
	//billboard image values
	return new Image(readImageValues,width,height,fileName);
}


/*
========================================================================================================
	Name: parsePPM
	Purpose: parses binary PPM (P6) file data into internal Image class format.
	Arguments:
			file_data - raw PPM file content string
			fileName - source image file name string
	Return: Image object containing RGBAValue pixels and dimensions
========================================================================================================
*/
function parsePPM(file_data,fileName){//The function to parse PPM file from homework 1.
    /*
   * Extract header
   */
   var readImageValues=[];//Array of RGB instances
    var format = "";
    var max_v = 0;
    var lines = file_data.split(/#[^\n]*\s*|\s+/); // split text by whitespace or text following '#' ending with whitespace
    var counter = 0;
    // get attributes
    for(var i = 0; i < lines.length; i ++){
        if(lines[i].length == 0) {continue;} // skip it if gets nothing
        if(counter == 0){
            format = lines[i];
        }else if(counter == 1){
            width = Number(lines[i]);
        }else if(counter == 2){
            height = Number(lines[i]);
        }else if(counter == 3){
            max_v = Number(lines[i]);
        }else if(counter > 3){
            break;
        }
        counter ++;
    }
    if (debug_mode)console.log("Format: " + format);
    if (debug_mode)console.log("Width: " + width);
    if (debug_mode)console.log("Height: " + height);
    if (debug_mode)console.log("Max Value: " + max_v);
	
	var isHeaderFinished=false;//Since we don't know where the header has finished, we need to make this variable true when we are sure header has finished
	var numNextLineObserved=0;//It is used to count the valid lines read on header.
	var counterMain=0;//It is used for array of RGBAValue instances.
    for(var i = 0; i < file_data.length; i++){
		if(isHeaderFinished==true)
		{
			let r=parseInt(file_data.charCodeAt(i));
			let g=parseInt(file_data.charCodeAt(i+1));
			let b=parseInt(file_data.charCodeAt(i+2));
			readImageValues[counterMain]=new RGBAValue(r,g,b,255);
			i=i+2;//Since we've read 2 ahead characters, i value is increased manually
			counterMain=counterMain+1;
		}
		if(file_data.charCodeAt(i)==10)//If the character is next line "\n"
		{
			if(file_data.charCodeAt(i+1)!=35)//If the next line doesn't have # sumbol. We need to read 3 valid non comment lines to finish the header.
			{
				numNextLineObserved=numNextLineObserved+1;
				if(numNextLineObserved==3)//If 3 lines are read, header has finished
				{
					isHeaderFinished=true;
				}
			}
		}
    }
	return new Image(readImageValues,width,height,fileName);
}

/*
========================================================================================================
	Name: convertToPPM
	Purpose: converts current camera framebuffer into a PPM-compatible binary buffer.
	Arguments: None
	Return: Uint8Array containing full PPM file bytes (header + pixel data)
========================================================================================================
*/
function convertToPPM()
{
	var width = currentScene.camera.width;
	var height = currentScene.camera.height;
	convertedToPPM="P6";
	convertedToPPM+=(String.fromCharCode('10'));
	convertedToPPM+=(width);
	convertedToPPM+=(" ");
	convertedToPPM+=(height);
	convertedToPPM+=(String.fromCharCode('10'));
	convertedToPPM+=("255");//Assumiing LDR
	convertedToPPM+=(String.fromCharCode('10'));
	var headerBuffer = new Uint8Array(convertedToPPM.length);
	for (var i=0, strLen=convertedToPPM.length; i < strLen; i++) {
		headerBuffer[i] = convertedToPPM.charCodeAt(i);
	}
	var pixelData=new Uint8Array(width*height*3);
	for(var i = 0; i < width*height; i++){
		let x=Math.round(i%width);
		let y=Math.round(Math.floor(i/width));
		pixelData[i*3]=Math.min(255,currentScene.camera.bitmap[width-x-1][y].r);
		pixelData[i*3+1]=Math.min(255,currentScene.camera.bitmap[width-x-1][y].g);
		pixelData[i*3+2]=Math.min(255,currentScene.camera.bitmap[width-x-1][y].b);
	}
	var finalBuffer = new Uint8Array(headerBuffer.length + pixelData.length);
	finalBuffer.set(headerBuffer);
	finalBuffer.set(pixelData, headerBuffer.length);
	convertedToPPM = new TextDecoder("ascii").decode(finalBuffer);
	return finalBuffer;
}

/*
========================================================================================================
	Name: writeScene
	Purpose: exports current render to `myscene.ppm` using FileSaver.
	Arguments: None
	Return: N/A - triggers browser file download when bitmap exists
========================================================================================================
*/
function writeScene() {
	if (currentScene.camera.bitmap !== undefined)
	{
		var buffer=convertToPPM();
		var blob = new Blob([buffer]);
		saveAs(blob, "myscene.ppm");
	}
}
