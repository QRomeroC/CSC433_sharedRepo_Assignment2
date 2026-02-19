/*
Author:
CS533, Homework 2
12 February 2025
Extend this header for your submission
Feel free to change this file and add/remove variables and functions
Template author: Amir Mohammad Esmaieeli Sikaroudi
*/

//All HTML (GUI) components
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
var newSceneReq = false;
var currentScene;//Current rendering scene

class Billboard {//This object stores a billboard
	constructor(LowerLeft,UpperLeft,UpperRight,LowerRight,imgFile,img){
		this.LowerLeft=LowerLeft;
		this.UpperLeft=UpperLeft;
		this.UpperRight=UpperRight;
		this.LowerRight=LowerRight;
		this.imgFile=imgFile;
		this.img=img;
	}
}

class Sphere {//This object stores a sphere
	constructor(center,radius,ambient){
		this.center=center;
		this.radius=radius;
		this.amb = ambient;
	}
}

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
}

class RGBAValue{
	constructor(r,g,b,a)
	{
		this.r=r;
		this.g=g;
		this.b=b;
		this.a=a;
	}
}

function makeImagePlane(eye,forward,right,up,dist,fovDeg,imgWidth,imgHeight){
	let aspect = imgWidth/imgHeight;
	let fovRad = (fovDeg * Math.PI) / 180.0;
	
	let halfHeight = dist * Math.tan(fovRad / 2.0);
	let halfWidth = halfHeight * aspect;
	
	let center = Vector3.sumTwoVectors(eye, Vector3.multiplyVectorScalar(forward,dist));
	
	let upPart = Vector3.multiplyVectorScalar(up,halfHeight);
	let rightPart = Vector3.multiplyVectorScalar(right,halfWidth);
	
	let LL = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,Vector3.negate(upPart)),Vector3.negate(rightPart));
	let UL = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,upPart),Vector3.negate(rightPart));
	let UR = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,upPart),rightPart);
	let LR = Vector3.sumTwoVectors(Vector3.sumTwoVectors(center,Vector3.negate(upPart)),rightPart);
	
	return { center: center, LL: LL, UL: UL, UR: UR, LR: LR, dist: dist };
}

class Camera{//This object stores camera vectors
	constructor(eye, lookAt, up, fovDeg, width, height, backgroundColor){
		this.eye = eye;
		this.lookAt = lookAt;
		this.up = up;
		this.fov = fovDeg;
		this.width = width;
		this.height = height;
		this.backgroundColor = backgroundColor || new RGBAValue(0,0,0,255);
		
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
		
		this.buildBasis();
		
		this.nearDist = 1.0;
		this.farDist = 10.0;
		
		this.nearPlane = makeImagePlane(this.eye, this.forward, this.right, this.trueUp,
										this.nearDist, this.fov, this.width, this.height);
										
		this.farPlane = makeImagePlane(this.eye, this.forward, this.right, this.trueUp,
									   this.farDist, this.fov, this.width, this.height);
	}
	
	buildBasis(){
		this.forward = Vector3.normalizeVector(Vector3.minusTwoVectors(this.lookAt, this.eye));
		this.right = Vector3.normalizeVector(Vector3.crossProduct(this.forward, this.up));
		this.trueUp = Vector3.normalizeVector(Vector3.crossProduct(this.right, this.forward));
	}
	
	generateRay(pixelX, pixelY){
		let w = this.width;
		let h = this.height;
		
		let u = (pixelX + 0.5) / w;
		let v = (pixelY + 0.5) / h;
		
		//point = UL + u(UR-UL) + v(LL-UL)
		let LL = this.nearPlane.LL;
		let UL = this.nearPlane.UL;
		let UR = this.nearPlane.UR;
		
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
	}

	// Call drawScene again next frame with delay to give user chance of interacting HTML GUI
	setTimeout(function() { requestAnimationFrame(drawScene)}, 1000);

}

/*
Test GIF create function and global variables. Feel free to revise this for your assingment.
*/

var gifT=0;// The animation time that is between 0 and 1
var encoder;// The encoder to save GIF file

function createGif(){
    document.getElementById("canvas").setAttribute("width",100);
	document.getElementById("canvas").setAttribute("height",100);
	gifT=0;
	encoder = new GIFEncoder();
	encoder.setRepeat(0); //0  -> loop forever
	encoder.setDelay(500); //go to next frame every n milliseconds
	encoder.start();
	testCreateGIFLoop();
}

/*
Test GIF create function and global variables. Feel free to revise this for your assingment.
*/

function testCreateGIFLoop(){
	if(gifT<1){
		let imgData=ctx.createImageData(100,100);
		for(let i=0;i<100;i++){
			for(let j=0;j<100;j++){
				imgData.data[((i*100)+j)*4]=i*2;
				imgData.data[((i*100)+j)*4+1]=j+Math.sin(gifT*10);
				imgData.data[((i*100)+j)*4+2]=i+gifT*100;
				imgData.data[((i*100)+j)*4+3]=255;
			}	
		}
		ctx.putImageData(imgData,0,0);//Show image on canvas
		encoder.addFrame(ctx);
		gifT=gifT+0.1;
		setTimeout(function() { requestAnimationFrame(testCreateGIFLoop)}, 100);
	}else{
		encoder.finish();
		encoder.download("download.gif");
	}
}

function shootRays()//This function shoots rays
{
	
}

function findRayCollisionColor(ray)//Get color from ray casting
{
	
}

function getSphereRayCollisionPoint(input,ray)//Get ray sphere collision
{

}

function readSceneMaterial()//This is the function that is called after user selects multiple files of images and scenes
{
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
					console.log(fileName);
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
							//console.log(png);
							let img = parsePNG(png,fileName);

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
	
	let firstBracket = text.indexOf("{");
	let lastBracket = text.lastIndexOf("}");
	if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket){
		text = text.substring(firstBracket,lastBracket + 1);
	}
	
	let obj = null;
	try{
		obj = JSON.parse(text);
	} catch(err){
		console.log("JSON parse failed", err);
		console.log("scene text snippet:", text.substring(0,200));
		return null;
	}
	
	console.log(obj);
	let eye = [0,0,5];
	if (obj.eyeLocations && obj.eyeLocations.length >0){
		eye = obj.eyeLocations[0];
	}
	console.log(eye);
	let lookat = obj.lookat;
	console.log(lookat);
	let up = obj.up;
	console.log(up);
	let fov = obj.fov_angle;
	console.log(fov);
	let width = obj.width;
	console.log(width);
	let height = obj.height;
	console.log(height);
	
	let bgArr = obj.DefaultColor || obj.DefaulColor;
	console.log(bgArr);
	let bgColor = new RGBAValue(bgArr[0],bgArr[1],bgArr[2],255);
	console.log(bgColor);
	
	let camera = new Camera(
		new Vector3(eye[0], eye[1], eye[2]),
		new Vector3(lookat[0], lookat[1], lookat[2]),
		new Vector3(up[0], up[1], up[2]),
		fov,
		width,
		height,
		bgColor
	);
	console.log(camera);
	
	let spheres = [];
	let sphereList = obj.spheres || [];
	for (let i = 0; i < sphereList.length; i++){
		let currSphere = sphereList[i];
		console.log("currSphere: ",currSphere);
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
	console.log(spheres);
	
	let billboards = [];
	let bbList = obj.billboards || [];
	for (let i = 0; i < bbList.length; i++){
		let currBB = bbList[i];
		console.log("currBB: ",currBB);
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
		));
	}
	console.log(billboards);
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
	return new Image(readImageValues,width,height,fileName);
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
    console.log("Format: " + format);
    console.log("Width: " + width);
    console.log("Height: " + height);
    console.log("Max Value: " + max_v);
	
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
