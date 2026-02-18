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
	constructor(UpperLeft,LowerLeft,UpperRight,imgFile,img){
		this.UpperLeft=UpperLeft;
		this.LowerLeft=LowerLeft;
		this.UpperRight=UpperRight;
		this.imgFile=imgFile;
		this.img=img;
	}
}

class Sphere {//This object stores a sphere
	constructor(center,radius,color){
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
			for(let y = 0; y < height; y++){
				this.bitmap[x][y] = new RGBAValue(0,0,0,255);
			}
		}
		this.rebuildBasis();
	}
	
	rebuildBasis(){
		this.foward = Vector3.normalizeVector(Vector3.minusTwoVectors(this.lookAt,this.eye));
		this.right = Vector3.normalizeVector(Vector3.crossProduct(this.foward,this.up));
		this.trueUp = Vector3.normalizeVector(Vector3.crossProduct(this.right,this.forward));
	}	
	
	generateRay(pixelX, pixelY){
		let w = this.width;
		let h = this.height;
		let aspect = w/h;
		
		let fovRad = (this.fov * Math.PI)/180.0;
		let tanHalfFOV = Math.tan(fovRad/2.0);
		
		let normDevCoordX = (2 * (pixelX + 0.5) / w) - 1;
		let normDevCoordY = 1 - (2 * (pixelY + 0.5) / h);
		
		let px = normDevCoordX * tanHalfFOV * aspect;
		let py = normDevCoordY * tanHalfFOV;
		
		let dir = Vector3.sumTwoVectors(
			this.foward,
			Vector3.sumTwoVectors(
				Vector3.multiplyVectorScalar(this.right, px),
				Vector3.multiplyVectorScalar(this.trueUp, py)
			)
		);
		
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
		this.direction = Vector3.normalizeVector(dirction);
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
		let currScene = scense[s];
		if(!currScene){
			continue;
		}
		for (let b = 0; b < scene.billboards.length; b++){
			let bb = scene.billboards[b];
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
	if scense.length > 0){
		currentScene = scenes[0];
	}
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
	
	let camObj = obj.camera || obj.cam || obj;
	let eyeArr = camObj.eye || camObj.position || [0,0,5];
	let atArr = camObj.lookAt || camObj.at || [0,0,0];
	let upArr = camObj.up || [0,1,0];
	
	let fov = camObj.fov_angle || camObj.fovy || 60;
	let width = camObj.width || 256;
	let height = camObj.height || 256;
	
	let bg = camObj.background || camObj.bg || [0,0,0];
	let bgColor = new RGBAValue(bg[0],bg[1],bg[2],255);
	
	let camera = new Camera(
		new Vector3(eyeArr[0], eyeArr[1], eyeArr[2]),
		new Vector3(atArr[0], atArr[1], atArr[2]),
		new Vector3(upArr[0], upArr[1], upArr[2]),
		fov,
		width,
		height,
		bgColor
	);
	
	let spheres = [];
	let sphereList = obj.spheres || obj.objects || [];
	for (let i = 0; i < sphereList.length; i++){
		let currSphere = sphereList[i];
		if (!currSphere){
			continue;
		}
		if (currSphere.type && currSphere.type.toLowerCase() != "sphere"){
			continue;
		}
		let center = currSphere.center || currSphere.c || [0,0,0];
		let radius = currSphere.radius || currSphere.r || 1;
		let color = currSphere.color || currSphere.rgb || [255,0,0];
		
		spheres.push(new Sphere(
			new Vector3(center[0],center[1],center[2]),
			radius,
			new RGBAValue(color[0],color[1],color[2],255)
		));
	}
	
	let billboards = [];
	let bbList = obj.billboards || obj.quads || [];
	for (let i = 0; i <bbList.length; i++){
		let currBB = bbList[i];
		if (!currBB){
			continue;
		}
		if (currBB.type && currBB.type.toLowerCase() != "billboard"){
			continue;
		}
		let UL = currBB.UpperLeft || currBB.upperLeft || currBB.ul;
		let LL = currBB.LowerLeft || currBB.lowerLeft || currBB.ll;
		let UR = currBB.UpperRight || currBB.upperRight || currBB.ur;
		let imgFile = currBB.imgFile || currBB.texture || currBB.image || "";
		
		if(LL && UL && UR){
			billboards.push(new Billboard(
				new Vector3(LL[0], LL[1], LL[2]),
				new Vector3(UL[0], UL[1], UL[2]),
				new Vector3(UR[0], UR[1], UR[2]),
				imgFile,
				null
			));
		}
	}
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
