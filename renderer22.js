/*
Author:
CS533, Homework 2
12 February 2026
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


var currentScene;//Current rendering scene

class Billboard {//This object stores a billboard
	constructor(UpperLeft,LowerLeft,UpperRight,LowerRight,imgFile,img){
		this.UpperLeft=UpperLeft;
		this.LowerLeft=LowerLeft;
		this.UpperRight=UpperRight;
		this.LowerRight=LowerRight;
		this.imgFile=imgFile;
		this.img=img;
	}
}

class Sphere {//This object stores a sphere
	constructor(center,radius,color){
		this.center=center;
		this.radius=radius;
		this.color=color;
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
	constructor(){
		
	}
}

class Scene{//This object stores everything required for a scene

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

							// *** This is a show case of how PNGImage can be shown in Canvas. REMOVE COMMENT TO SEE THE RESULT
							
							let width=img.width;
							let height=img.height;
							document.getElementById("canvas").setAttribute("width", img.width);
							document.getElementById("canvas").setAttribute("height", img.height);
							let showCaseData = ctx.createImageData(width, height);
							for(var i = 0; i < img.data.length; i+=1){
								showCaseData.data[i* 4]=img.data[i].r;
								showCaseData.data[i* 4+1]=img.data[i].g;
								showCaseData.data[i* 4+2]=img.data[i].b;
								showCaseData.data[i* 4+3]=img.data[i].a;
							}
							ctx.putImageData(showCaseData, canvas.width/2 - width/2, canvas.height/2 - height/2);
							
							// *** This is a show case of how PNGImage can be shown in Canvas. REMOVE COMMENT TO SEE THE RESULT

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
	
}

function parseScene(file_data)//A function to read JSON and put the data inside a scene class
{
	
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