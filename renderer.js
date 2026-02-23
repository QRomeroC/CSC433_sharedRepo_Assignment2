/*
Author:
CS533, Homework 2
12 February 2025
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
//debug flag
const debug_mode = false;
const single_test = true;
const single_shot = false;
/*
--------------------Start of class declarations-------------------
*/
/*
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
*/
class Billboard {//This object stores a billboard
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
	Name: Sphere
	Purpose: class representing a shpere. takes a single vec3 for center point,
			a float that represents the radius, and a RGBAValue array having converted
			3 float values into there RGBA Values.
	Arguments: Constructor expects:
				center - Vector3 with C[0],C[1],C[2] parsed from json
				radius - float representing radius of Sphere
				amb - a RGBAValue array with values converted from floats ([0.00,0.00,0.00]->[r,g,b,a])
	Return: N/A - used in the construction of sphere objects during scene parsing
*/
class Sphere {//This object stores a sphere
	constructor(center,radius,ambient){
		this.center=center;
		this.radius=radius;
		this.amb = ambient;
	}
}//end of Sphere class

//Vector 3 class given - contains math for matrices and vectors
class Vector3{//Required math functions are made from scratch
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
	Return: N/A - used in the construction of a camera object to initialized the image plane
				for camera object being constructed.
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
	Name: Camera
	Purpose: class representing a camera. takes...
	Arguments: Constructor expects:
				eye - 
				lookAt - 
				worldUp - 
				fov - 
				width - 
				height - 
				backgroundColor - 
				
				constructor generates:
				bitmap - 
				foward -
				right -
				trueUp - 
				fovRad - 
				halfHeight - 
				halfWidth -
				planeDist - 
				imagePlane - 
				
				class functions:
				buildBasis()
				
				generateRay()
				
	Return: N/A - used in the construction of camera objects during scene parsing and to generate rays for camera
*/
class Camera{//This object stores camera vectors
	constructor(eye, lookAt, up, fovDeg, width, height, backgroundColor){
		this.eye = eye;
		this.lookAt = lookAt;
		this.worldUp = up;
		this.fov = fovDeg;
		this.width = width;
		this.height = height;
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
		
		//let halfHeight = this.height / 2.0;
		//let halfWidth = this.width / 2.0;
		//half is 1 since image plane width/height should be 2 across
		let halfHeight = 1.0;
		//let halfWidth = (this.width / this.height) * halfHeight;
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
		buildBasis() - class function for calculating the camera basis
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
		generateRay() - class function that for a given pixel (x,y) generate a new 
		ray object with a origin at eye and direction calculated from point p - eye
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
		return new Ray(this.eye, dir);
	}
}

class Scene{//This object stores everything required for a scene
	constructor(camera,spheres,billboards){
		this.camera = camera;
		this.spheres = spheres || [];
		this.billboards = billboards || [];
	}
}

class Image{//This object stores image data
	constructor(data,width,height,fileName){
		this.data=data;
		this.fileName=fileName;
		this.width=width;
		this.height=height;
	}
}

class Ray{//This object stores the data for a ray
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

// Draw the scene.
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
		/*
		if(!renderedOnce && single_test){
			if (debug_mode)console.log("drawing scene");
			renderedOnce = true;
			if (debug_mode)console.log("shooting ray");
			if (single_shot){
				shootSingleCenterRay();
			} else {
				shootRays();
			}
		} else {
			shootRays();
		}
		*/
		shootRays();
	}

	// Call drawScene again next frame with delay to give user chance of interacting HTML GUI
	setTimeout(function() { requestAnimationFrame(drawScene)}, 1000);

}

/*
Test GIF create function and global variables. Feel free to revise this for your assingment.
*/

var gifT=0;// The animation time that is between 0 and 1
var encoder;// The encoder to save GIF file
var gifFrame = 0;
var gifTotalFrames = 30;

// function createGif(){
//     document.getElementById("canvas").setAttribute("width",100);
// 	document.getElementById("canvas").setAttribute("height",100);
// 	gifT=0;
// 	encoder = new GIFEncoder();
// 	encoder.setRepeat(0); //0  -> loop forever
// 	encoder.setDelay(500); //go to next frame every n milliseconds
// 	encoder.start();
// 	testCreateGIFLoop();
// }



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
Test GIF create function and global variables. Feel free to revise this for your assingment.
*/

// function testCreateGIFLoop(){
// 	if(gifT<1){
// 		let imgData=ctx.createImageData(100,100);
// 		for(let i=0;i<100;i++){
// 			for(let j=0;j<100;j++){
// 				imgData.data[((i*100)+j)*4]=i*2;
// 				imgData.data[((i*100)+j)*4+1]=j+Math.sin(gifT*10);
// 				imgData.data[((i*100)+j)*4+2]=i+gifT*100;
// 				imgData.data[((i*100)+j)*4+3]=255;
// 			}	
// 		}
// 		ctx.putImageData(imgData,0,0);//Show image on canvas
// 		encoder.addFrame(ctx);
// 		gifT=gifT+0.1;
// 		setTimeout(function() { requestAnimationFrame(testCreateGIFLoop)}, 100);
// 	}else{
// 		encoder.finish();
// 		encoder.download("download.gif");
// 	}
//}

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



//debug version of shootRays()
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
			candidateColor = currSphere.amb;
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
	/*
	let org = ray.origin;
	let dir = ray.direction;
	let cent = input.center;
	let radius = input.radius;

	//Calulate OC
	let originCentVect = Vector3.subtracVector(org, cent);

	//Calulate a,b and c quadratc coefficients
	let a = Vector3.dotProduct(dir,dir);
	let b = 2.0 * Vector3.dotProduct(originCentVect, dir);
	let c = Vector3.dotProduct(originCentVect, originCentVect) - (radius * radius);

	//Everything under the root in the quadratic equation make next few lines easier to write and less unruly.
	let discriminant = (b*b) - 4 * a * c;

	//We have a complex number no real root, so ray does not intersect the sphere
	if (discriminant < 0) 
	{
		 return null;
	}

	//Root the discrimnant save as var to make lines below easier to write
	let sqrtDiscriminant = Math.sqrt(discriminant);

	//The roots of the quadratic.  Note: atT1 will be the closest intersection and should be the pixel that is lit up
	let atT1 = (-b - sqrtDiscriminant) / (2.0 * a);
	let atT2 = (-b + sqrtDiscriminant) / (2.0 * a);

	//Make sure values are greater than 1.  If values are negative they are behind the camera, so won't show up on the screen 
	if (atT1 > 0 )
	{
		return atT1;
	}

	//If value 1 is negative but atT2 is positive the sphere may be over the camera and the second root will be on the screen.
	if (atT2 > 0)
	{
		return atT2;
	}
	*/
	//O-C
	//input == sphere
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
	/*
	if (t1 > 0.0001) {
		t = t1;
	} else if (t2 > 0.0001){
		t = t2;
	}
	*/
	if (t1 >= currentScene.camera.planeDist){
		t = t1;
	} else if (t2 >= currentScene.camera.planeDist){
		t = t2;
	}
	
	return t;
}

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
	/*
	let edgeU = Vector3.minusTwoVectors(pLR, pLL);
	let edgeV = Vector3.minusTwoVectors(pUL, pLL);
	
	let w = Vector3.getMagnitude(edgeU);
	if (debug_mode)console.log("w : ", w);
	let h = Vector3.getMagnitude(edgeV);
	if (debug_mode)console.log("h : ", h);
	if (w <= 0.000001 || h <= 0.000001){
		return null;
	}
	
	let U = Vector3.multiplyVectorScalar(edgeU, 1.0 / w);
	let V = Vector3.multiplyVectorScalar(edgeV, 1.0 / h);
	if (debug_mode)console.log("U :", U);
	if (debug_mode)console.log("V :", V);
	*/
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
	/*
	if (t <= 0.0001){
		return null;
	}
	*/
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
	//let pixelData = bb.img.data[100];
	/*
	if (debug_mode)console.log("pixel[0] :", bb.img.data[0]);
	if (debug_mode)console.log("pixel[1] :", bb.img.data[1]);
	if (debug_mode)console.log("pixel[100] :", bb.img.data[100]);
	if (debug_mode)console.log("pixel[1000] :", bb.img.data[1000]);
	if (debug_mode)console.log("pixel[10000] :", bb.img.data[10000]);
	if (debug_mode)console.log("pixel[100000] :", bb.img.data[10000]);
	*/
	//ignore alphas that are 0 (transparent)
	if (pixelData.a == 0){
		return null;
	}
	
	return { t: t, color: new RGBAValue(pixelData.r, pixelData.g, pixelData.b, 255) };
}

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
							/*
							let zeroAlphaCount = 0;
						    for (let i = 0; i < img.data.length; i++){
								if (img.data[i].a == 0){
									zeroAlphaCount++;
								}
							}
							if (debug_mode)console.log("alpha count: ", zeroAlphaCount, "out of: ", img.data.length);
							*/
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

function assignImagesToScenes()//Initially the scene and images need to be read async, therefore, after reading the files, images should be assinged to billboards inside the scenes
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

function clamp255(x){
	if (x < 0) return 0;
	if (x > 255) return 255;
	return x;
}

function floatColorToRGBA(arr){
	let r = clamp255(Math.round(arr[0] * 255));
	let g = clamp255(Math.round(arr[1] * 255));
	let b = clamp255(Math.round(arr[2] * 255));
	return new RGBAValue(r,g,b,255);
}

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

// This function reads a PNG file into RGBA
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
	
	/*
	let raw = png.getRGBA8Array();
	let width = png.getWidth();
	let height = png.getHeight();
	
	let pixelCount = width * height;
	let readImageValues = new Array(pixelCount);
	if (debug_mode)console.log("rawLen: ", raw.length, "rawLen/4: ", raw.length/4);
	if (debug_mode)console.log("pixelCount: ", pixelCount);
	
	for (let p = 0; p < pixelCount; p++){
		//"word" size is 4, offset = r, offset+1,2,3 == g,b,a
		let base = p * 4;
		let r = raw[base];
		let g = raw[base + 1];
		let b = raw[base + 2];
		let a = raw[base + 3];
		//write to rgba
		readImageValues[p] = new RGBAValue(r,g,b,a);
	}
	
	if (debug_mode)console.log("PNG len of raw: ", raw.length, "expected: ", pixelCount * 4);
	if (debug_mode)console.log("first pixel: ", readImageValues[0]);
	*/
	return new Image(readImageValues, width, height, fileName);
}

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

//Convert framebuffer to PPM file
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

//Uses library "FileSaver.js" to save a buffer to file
function writeScene() {
	if (currentScene.camera.bitmap !== undefined)
	{
		var buffer=convertToPPM();
		var blob = new Blob([buffer]);
		saveAs(blob, "myscene.ppm");
	}
}
