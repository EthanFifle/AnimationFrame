// Template code for A2 Fall 2021 -- DO NOT DELETE THIS LINE

var canvas;
var gl;

var program ;

var near = 1;
var far = 100;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = false ;
var prevTime = 0.0 ;
var useTextures = 1 ;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;

function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

function loadFileTexture(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;

    gl.bindTexture( gl.TEXTURE_2D, tex.textureWebGL );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true ;

}

// Textures

function initTextures() {

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"sunset.bmp") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Metallic.jpg") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"TennisBall.jpg") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Desk.jpg") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"Knuckles.jpg") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"LampBase.jpg") ;

    //textureArray.push({}) ;
    //loadImageTexture(textureArray[textureArray.length-1],image2) ;

}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;

    textureObj.isTextureReady = true ;
}

//----------------------------------------------------------------

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
                                        "shininess"),materialShininess );
}

function toggleTextures() {
    useTextures = 1 - useTextures ;
    gl.uniform1i( gl.getUniformLocation(program,
                                         "useTextures"), useTextures );
}

function waitForTextures1(tex) {
    setTimeout( function() {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = (new Date()).getTime() ;
    if( !tex.isTextureReady )
    {
        console.log(wtime + " not ready yet") ;
        waitForTextures1(tex) ;
    }
    else
    {
        console.log("ready to render") ;
        window.requestAnimFrame(render);
    }
               },5) ;

}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;

}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(18,program);
    Cone.init(18,program) ;
    Sphere.init(36,program) ;

    gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    // set a default material
    setColor(materialDiffuse) ;



    // set the callbacks for the UI elements
    document.getElementById("sliderXi").oninput = function() {
        RX = this.value ;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").oninput = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").oninput = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };

    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };

    // load and initialize the textures
    initTextures() ;

    // Recursive wait for the textures to load
    waitForTextures(textureArray) ;
    //setTimeout (render, 100) ;

}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube(texture, name, value, activate) {

    setMV() ;

    gl.activeTexture(activate);
    gl.bindTexture(gl.TEXTURE_2D, texture.textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, name), value);

    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere(texture, name, value, activate) {
    setMV() ;

    gl.activeTexture(activate);
    gl.bindTexture(gl.TEXTURE_2D, texture.textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, name), value);

    Sphere.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone(texture, name, value, activate) {
    setMV() ;

    gl.activeTexture(activate);
    gl.bindTexture(gl.TEXTURE_2D, texture.textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, name), value);

    Cone.draw() ;
}

function drawCylinder(texture, name, value, activate) {
    setMV() ;

    gl.activeTexture(activate);
    gl.bindTexture(gl.TEXTURE_2D, texture.textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, name), value);

    Cylinder.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

var elapsedTime = 0.0;
var lastResetTime = 0.0;
var resetInterval = 3.0; // 3 seconds intervals for animation
let distance = 10;  // adjust this value to control the distance of the camera

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    eye = vec3(0,0,25);
    eye[1] = eye[1] + 0 ;

    projectionMatrix = ortho(-distance, distance, -distance, distance, near, far);

    // set the projection matrix
    //projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);

    // initialize the modeling matrix stack
    MS= [] ;
    modelMatrix = mat4() ;

    // apply the slider rotations
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;

    // send all the matrices to the shaders
    setAllMatrices() ;

    // get real time
    var curTime ;
    if( animFlag )
    {

        animateCamera();

        curTime = (new Date()).getTime() / 1000 ;

        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }

        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;

        // The below section of code is used to updated and reset the elapsedTime variable which acts as a counter
        // for drawing bubbles. An interval is declared as a target time to reach (ex. 6 seconds) When the real TIME
        // passes the interval time (after the last time the interval was reset) the elapsed time is set back to 0
        elapsedTime = TIME % resetInterval;

        if (TIME - lastResetTime >= resetInterval) {
            elapsedTime = 0.0;
            lastResetTime = TIME;
        }

    }

    /****************************** Useful Functions* ******************************/

    // Rotates an object from angle a to angle b in a set time interval
    // Also set the speed (in terms of frequency) between oscillations
    function setRotation(a, b, interval) {
        // Calculate the progress of time within the duration
        const rotateIn = Math.min(1, elapsedTime / interval);

        // Linear interpolation between a and b
        return a + (b - a) * rotateIn;
    }

    // Set the translation speed and distance
    function setTranslation( interval, distance ) {

        const translateIn = Math.min(1, elapsedTime / interval);

        return translateIn * distance;
    }

    function utilityRIC(rotations, interval){

        let rotateX = 0;
        let rotateY = 0;
        let rotateZ = 0;

        rotateX = setRotation(rotations.rotXFrom, rotations.rotXTo, interval);
        rotateY = setRotation(rotations.rotYFrom, rotations.rotYTo, interval);
        rotateZ = setRotation(rotations.rotZFrom, rotations.rotZTo, interval);

        return {
            rotateX: rotateX,
            rotateY: rotateY,
            rotateZ: rotateZ,
        };

    }

    function animateCamera(){

        var interval = 3;
        let struct;

        const cameraAnimation = { // Animation variable control
            // Camera time series rotations
            time0: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0}, // don't rotate initially
            time1: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: -180, rotZFrom: 0, rotZTo: 0},
            time2: { rotXFrom: 0, rotXTo: 0, rotYFrom: -180, rotYTo: -360, rotZFrom: 0, rotZTo: 0},
            time3: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 50, rotZFrom: 0, rotZTo: 0},
            time4: { rotXFrom: 0, rotXTo: 0, rotYFrom: 50, rotYTo: 0, rotZFrom: 0, rotZTo: 0},
            time5: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: -50, rotZFrom: 0, rotZTo: 0},
            time6: { rotXFrom: 0, rotXTo: 0, rotYFrom: -50, rotYTo: 0, rotZFrom: 0, rotZTo: 0},
            time7: { rotXFrom: 0, rotXTo: -10, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0},
            time8: { rotXFrom: -10, rotXTo: 30, rotYFrom: 0, rotYTo: 70, rotZFrom: 0, rotZTo: 0},
            time9: { rotXFrom: 30, rotXTo: 30, rotYFrom: 70, rotYTo: -430, rotZFrom: 0, rotZTo: 0},
            time10: { rotXFrom: 30, rotXTo: 0, rotYFrom: -70, rotYTo: 0, rotZFrom: 0, rotZTo: 0},
            time11: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: -120},
            time12: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 0, rotZFrom: -120, rotZTo: -240},
            time13: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 0, rotZFrom: -240, rotZTo: -360}

        };

        if(TIME <= 3.0){

            distance += setTranslation(interval, 0.07);

            const rotations = cameraAnimation.time0;

            struct = utilityRIC(rotations, interval);

        }

        if(3.0 < TIME && TIME <= 6.0){

            const rotations = cameraAnimation.time1;

            struct = utilityRIC(rotations, interval);

        }

        if(6.0 < TIME && TIME <= 9.0){

            const rotations = cameraAnimation.time2;

            struct = utilityRIC(rotations, interval);

        }

        if(9.0 < TIME && TIME <= 12.0){

            const rotations = cameraAnimation.time3;

            struct = utilityRIC(rotations, interval);

        }

        if(12.0 < TIME && TIME <= 15.0){

            distance -= setTranslation(interval, 0.07);

            const rotations = cameraAnimation.time4;

            struct = utilityRIC(rotations, interval);

        }

        if(15.0 < TIME && TIME <= 18.0){

            const rotations = cameraAnimation.time5;

            struct = utilityRIC(rotations, interval);

        }

        if(18.0 < TIME && TIME <= 21.0){

            distance -= setTranslation(interval, 0.05);

            const rotations = cameraAnimation.time6;

            struct = utilityRIC(rotations, interval);

        }

        if(21.0 < TIME && TIME <= 24.0){

            distance += setTranslation(interval, 0.07);

            const rotations = cameraAnimation.time7;

            struct = utilityRIC(rotations, interval);

        }

        if(24.0 < TIME && TIME <= 27.0){

            const rotations = cameraAnimation.time8;

            struct = utilityRIC(rotations, interval);

        }

        if(27.0 < TIME && TIME <= 30.0){

            const rotations = cameraAnimation.time9;

            struct = utilityRIC(rotations, interval);

        }

        if(30.0 < TIME && TIME <= 33.0){

            distance += setTranslation(interval, 0.05);

            const rotations = cameraAnimation.time10;

            struct = utilityRIC(rotations, interval);

        }

        if(33.0 < TIME && TIME <= 36.0){

            const rotations = cameraAnimation.time11;

            struct = utilityRIC(rotations, interval);

        }

        if(36.0 < TIME && TIME <= 39.0){

            const rotations = cameraAnimation.time12;

            struct = utilityRIC(rotations, interval);

        }

        if(39.0 < TIME && TIME <= 42.0){

            const rotations = cameraAnimation.time13;

            struct = utilityRIC(rotations, interval);

        }

        if(42.0 < TIME && TIME <= 45.0){

            const rotations = cameraAnimation.time0;

            struct = utilityRIC(rotations, interval);

        }

        gRotate(struct.rotateX,1,0,0);
        gRotate(struct.rotateY,0,1,0);
        gRotate(struct.rotateZ,0,0,1);
    }

    // Sets translations and rotations for the palm given from time series values in the animatePalm function
    function utilityRTI(rotations, translations, interval){

        let rotateX = 0;
        let rotateY = 0;
        let rotateZ = 0;
        let translateX = 0;
        let translateY = 0;
        let translateZ = 0;

        translateX = setTranslation(interval, translations.distanceX);
        translateY = setTranslation(interval, translations.distanceY);
        translateZ = setTranslation(interval, translations.distanceZ);

        rotateX = setRotation(rotations.rotXFrom, rotations.rotXTo, interval);
        rotateY = setRotation(rotations.rotYFrom, rotations.rotYTo, interval);
        rotateZ = setRotation(rotations.rotZFrom, rotations.rotZTo, interval);

        return {
            translateX: translateX,
            translateY: translateY,
            translateZ: translateZ,
            rotateX: rotateX,
            rotateY: rotateY,
            rotateZ: rotateZ,
        };

    }

    function animatePalm(){

        var interval = 3;
        let struct;

        const palmAnimation = { // Animation variable control
            // Palm time series rotations
            0: {
                /*time1: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0}, // testing
                time2: { rotXFrom: 0, rotXTo: 0, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0}, // testing

                 */
                time1: { rotXFrom: 0, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 40},
                time2: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 40, rotZTo: -40},
                time3: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: -40, rotZTo: 40},
                time4: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 40, rotZTo: 0},
                time5: { rotXFrom: -90, rotXTo: 15, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0},
                time6: { rotXFrom: 15, rotXTo: 15, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0},
                time7: { rotXFrom: 15, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 40},
                time8: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 40, rotZTo: -40},
                time9: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: -40, rotZTo: 40},
                time10: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 40, rotZTo: 0},
                time11: { rotXFrom: -90, rotXTo: -90, rotYFrom: 0, rotYTo: 0, rotZFrom: 0, rotZTo: 0}

            },
            // Palm time series translations
            1: {
                time0: { distanceX: 0, distanceY: 0, distanceZ: 0 }, // default no translation
                time1: { distanceX: 0, distanceY: 6, distanceZ: -4 },
                time2: { distanceX: -1, distanceY: 1, distanceZ: 7 }, // palm facing forward is z +ve axis (-1,7,3)
                time3: { distanceX: 0, distanceY: 0, distanceZ: -8 }, //

            },

        };

        if(TIME <= 3.0){

            const rotations = palmAnimation[0].time1;
            const translations = palmAnimation[1].time1;

            struct = utilityRTI(rotations, translations, interval);

        }

        if(3.0 < TIME && TIME <= 6.0){

            const rotations = palmAnimation[0].time2;
            const translations = palmAnimation[1].time0;
            const prevPos = palmAnimation[1].time1; // previous position of translation

            gTranslate(prevPos.distanceX, prevPos.distanceY, prevPos.distanceZ)

            struct = utilityRTI(rotations, translations, interval);

        }

        if(6.0 < TIME && TIME <= 9.0){

            const rotations = palmAnimation[0].time3;
            const translations = palmAnimation[1].time0;
            const prevPos = palmAnimation[1].time1; // previous position of translation (that was changed)

            gTranslate(prevPos.distanceX, prevPos.distanceY, prevPos.distanceZ)

            struct = utilityRTI(rotations, translations, interval);

        }

        if(9.0 < TIME && TIME <= 12.0){

            interval = 2;
            const rotations = palmAnimation[0].time4;
            const translations = palmAnimation[1].time0;
            const prevPos = palmAnimation[1].time1; // previous position of translation (that was changed)

            gTranslate(prevPos.distanceX, prevPos.distanceY, prevPos.distanceZ)

            struct = utilityRTI(rotations, translations, interval);

        }

        if(12.0 < TIME && TIME <= 15.0){

            const rotations = palmAnimation[0].time5;
            const translations = palmAnimation[1].time0;
            const prevPos = palmAnimation[1].time1; // previous position of translation (that was changed)

            gTranslate(prevPos.distanceX, prevPos.distanceY, prevPos.distanceZ)

            struct = utilityRTI(rotations, translations, interval);

        }

        if(15.0 < TIME && TIME <= 18.0){

            const rotations = palmAnimation[0].time6;
            const translations = palmAnimation[1].time2;
            const prevPos = palmAnimation[1].time1; // previous position of translation (that was changed)

            gTranslate(prevPos.distanceX, prevPos.distanceY, prevPos.distanceZ)

            struct = utilityRTI(rotations, translations, interval);

        }

        if(18.0 < TIME && TIME <= 21.0){

            const rotations = palmAnimation[0].time6;
            const translations = palmAnimation[1].time3;

            gTranslate(-1, 7, 3) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(21.0 < TIME && TIME <= 24.0){

            const rotations = palmAnimation[0].time6;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(24.0 < TIME && TIME <= 27.0){

            const rotations = palmAnimation[0].time6;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(27.0 < TIME && TIME <= 30.0){

            const rotations = palmAnimation[0].time6;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(30.0 < TIME && TIME <= 33.0){

            const rotations = palmAnimation[0].time7;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(33.0 < TIME && TIME <= 36.0){

            const rotations = palmAnimation[0].time8;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(36.0 < TIME && TIME <= 39.0){

            const rotations = palmAnimation[0].time9;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(39.0 < TIME && TIME <= 42.0){

            interval = 2;
            const rotations = palmAnimation[0].time10;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        if(42.0 < TIME){

            interval = 2;
            const rotations = palmAnimation[0].time11;
            const translations = palmAnimation[1].time0;

            gTranslate(-1, 7, -5) // Hard coded from last translated distance

            struct = utilityRTI(rotations, translations, interval);

        }

        gTranslate(struct.translateX, struct.translateY, struct.translateZ);

        gRotate(struct.rotateX,1,0,0);
        gRotate(struct.rotateY,0,1,0); // use
        gRotate(struct.rotateZ,0,0,1);

    }

    function rotateFinger(knuckle_id, start_b, end_b, start_f, end_f, start_s, end_s, interval){

        if(knuckle_id === 1){
            // Rotate the base knuckle 0-30 degrees in a 3-second interval
            return setRotation(start_b, end_b, interval);
        }

        if(knuckle_id === 2){
            // Rotate the first knuckle 0-30 degrees in a 3-second interval
            return setRotation(start_f, end_f, interval);
        }

        if(knuckle_id === 3){
            // Rotate the second knuckle 0-50 degrees in a 3-second interval
            return setRotation(start_s, end_s, interval);
        }


    }

    // Animation handler for all things time
    function animateFingers(finger_id, knuckle_id){

        let rotation = 0; // initialize rotation to default position

        var interval = 3;

        const fingerAnimation = { // Animation variable control
            // Finger 1
            1: {
                // create a time-series of rotations for animation
                // (baseRotFrom/baseRotTo) base knuckle rotation angle from --- to
                // (firstRotFrom/firstRotTo) first knuckle rotation angle from --- to
                // (secondRotFrom/secondRotTo) second knuckle rotation angle from --- to
                time1: { baseRotFrom: 20, baseRotTo: 10, firstRotFrom: 20, firstRotTo: 10, secondRotFrom: 20, secondRotTo: 10 },
                time2: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 10, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 },
                time3: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 }, // Hold position
                time4: { baseRotFrom: 10, baseRotTo: 30, firstRotFrom: 10, firstRotTo: 25, secondRotFrom: 10, secondRotTo: 20 },
                time5: { baseRotFrom: 30, baseRotTo: 40, firstRotFrom: 25, firstRotTo: 55, secondRotFrom: 20, secondRotTo: 50 },
                time6: { baseRotFrom: 40, baseRotTo: 40, firstRotFrom: 55, firstRotTo: 55, secondRotFrom: 50, secondRotTo: 50 },
                time7: { baseRotFrom: 40, baseRotTo: 10, firstRotFrom: 55, firstRotTo: 15, secondRotFrom: 50, secondRotTo: 20 },
                time8: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 20, secondRotTo: 20 }

            },
            // Finger 2
            2: {
                time1: { baseRotFrom: 20, baseRotTo: 10, firstRotFrom: 20, firstRotTo: 10, secondRotFrom: 20, secondRotTo: 10 },
                time2: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 10, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 },
                time3: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 }, // Hold position
                time4: { baseRotFrom: 10, baseRotTo: 30, firstRotFrom: 10, firstRotTo: 35, secondRotFrom: 10, secondRotTo: 20 },
                time5: { baseRotFrom: 30, baseRotTo: 40, firstRotFrom: 35, firstRotTo: 55, secondRotFrom: 20, secondRotTo: 50 },
                time6: { baseRotFrom: 40, baseRotTo: 40, firstRotFrom: 55, firstRotTo: 55, secondRotFrom: 50, secondRotTo: 50 },
                time7: { baseRotFrom: 40, baseRotTo: 10, firstRotFrom: 55, firstRotTo: 15, secondRotFrom: 50, secondRotTo: 20 },
                time8: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 20, secondRotTo: 20 }

            },
            // Finger 3
            3: {
                time1: { baseRotFrom: 20, baseRotTo: 10, firstRotFrom: 20, firstRotTo: 10, secondRotFrom: 20, secondRotTo: 10 },
                time2: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 10, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 },
                time3: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 }, // Hold position
                time4: { baseRotFrom: 10, baseRotTo: 30, firstRotFrom: 10, firstRotTo: 35, secondRotFrom: 10, secondRotTo: 20 },
                time5: { baseRotFrom: 30, baseRotTo: 40, firstRotFrom: 35, firstRotTo: 55, secondRotFrom: 20, secondRotTo: 50 },
                time6: { baseRotFrom: 40, baseRotTo: 40, firstRotFrom: 55, firstRotTo: 55, secondRotFrom: 50, secondRotTo: 50 },
                time7: { baseRotFrom: 40, baseRotTo: 10, firstRotFrom: 55, firstRotTo: 15, secondRotFrom: 50, secondRotTo: 20 },
                time8: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 20, secondRotTo: 20 }

            },
            // Finger 4
            4: {
                time1: { baseRotFrom: 20, baseRotTo: 10, firstRotFrom: 20, firstRotTo: 10, secondRotFrom: 20, secondRotTo: 10 },
                time2: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 10, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 },
                time3: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 10, secondRotTo: 10 }, // Hold position
                time4: { baseRotFrom: 10, baseRotTo: 30, firstRotFrom: 10, firstRotTo: 35, secondRotFrom: 10, secondRotTo: 20 },
                time5: { baseRotFrom: 30, baseRotTo: 40, firstRotFrom: 35, firstRotTo: 55, secondRotFrom: 20, secondRotTo: 50 },
                time6: { baseRotFrom: 40, baseRotTo: 40, firstRotFrom: 55, firstRotTo: 55, secondRotFrom: 50, secondRotTo: 50 },
                time7: { baseRotFrom: 40, baseRotTo: 10, firstRotFrom: 55, firstRotTo: 15, secondRotFrom: 50, secondRotTo: 20 },
                time8: { baseRotFrom: 10, baseRotTo: 10, firstRotFrom: 15, firstRotTo: 15, secondRotFrom: 20, secondRotTo: 20 }


            }
        };

        if(TIME <= 3.0){ // Time animations in intervals of 3.0 as elapsedtime variable for rotations is 3 seconds

            if (fingerAnimation[finger_id]) { // For every finger_id in the struct

                //interval = 2.5;
                const rotations = fingerAnimation[finger_id].time1; // Predefined rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                                     rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                                     rotations.secondRotTo, interval);

            }

        }

        if(3.0 < TIME && TIME <= 6.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time2; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(6.0 < TIME && TIME <= 9.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time3; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }
        if(9.0 < TIME && TIME <= 12.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time3; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(12.0 < TIME && TIME <= 15.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time4; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(15.0 < TIME && TIME <= 18.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time5; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(18.0 < TIME && TIME <= 21.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time6; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(21.0 < TIME && TIME <= 24.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                //interval = 2;
                const rotations = fingerAnimation[finger_id].time6; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(24.0 < TIME && TIME <= 27.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time7; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(27.0 < TIME && TIME <= 30.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time8; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(30.0 < TIME && TIME <= 33.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time8; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(33.0 < TIME && TIME <= 36.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time8; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(36.0 < TIME && TIME <= 39.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time8; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(39.0 < TIME && TIME <= 42.0) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time8; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        if(42.0 < TIME) { // Time

            if (fingerAnimation[finger_id]) { // Finger

                interval = 1;
                const rotations = fingerAnimation[finger_id].time8; // Rotations per knuckle

                rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                    rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                    rotations.secondRotTo, interval);

            }

        }

        return rotation;
    }

    // Draws fingers with the base
    function drawFinger(fig_id, base){

        var bRot = animateFingers(fig_id, 1);      // base knuckle rotation (front-to-back)
        var rKnckOne = animateFingers(fig_id, 2);  // first knuckle rotation (front-to-back)
        var rKnckTwo = animateFingers(fig_id, 3);  // second knuckle rotation (front-to-back)

        // Base
        gScale(1/3, 1/2.5, 1/0.7);

        gTranslate(base,3,0);
        gRotate(bRot, 1,0,0)
        gScale(0.6,0.6,0.6);

        setColor(vec4(0.4,0.4,0.4,1.0));
        drawSphere(textureArray[4], "texture5", 4, gl.TEXTURE4); // Knuckles texture
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

        gPush() ; // first finger bone
        {
            gScale(1/0.6,1/0.6,1/0.6) ;
            gTranslate(0,1.3,0);
            gRotate(90,1,0,0)

            gScale(1.1,1.1,1.8);

            setColor(vec4(0.4,0.4,0.4,1.0));
            drawCylinder(textureArray[1], "texture2", 1, gl.TEXTURE1); // Knuckles texture
            gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

            gPush() ; // second finger knuckle
            {
                gScale(1/1.1 , 1/1.1 , 1/1.8);
                gRotate(-90,1,0,0)

                gTranslate(0, 1.1, 0);
                gRotate(rKnckOne, 1, 0,0); // Front-to back finger rotation
                gScale(0.5, 0.5, 0.5);

                setColor(vec4(0.4, 0.4, 0.4, 1.0));
                drawSphere(textureArray[4], "texture5", 4, gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                gPush(); // second finger bone
                {
                    gScale(1/0.5,1/0.5,1/0.5);

                    gTranslate(0,1.1,0);
                    gRotate(90,1,0,0)
                    gScale(1,1,1.5);

                    setColor(vec4(0.4,0.4,0.4,1.0));
                    drawCylinder(textureArray[1], "texture2", 1, gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                    gPush() ; // third finger knuckle
                    {
                        gScale(1, 1, 1 / 1.5);
                        gRotate(-90, 1, 0, 0)

                        gTranslate(0, 1, 0);
                        gRotate(rKnckTwo, 1, 0,0);
                        gScale(0.5, 0.5, 0.5);

                        setColor(vec4(0.4, 0.4, 0.4, 1.0));
                        drawSphere(textureArray[4], "texture5", 4, gl.TEXTURE4); // Knuckle texture
                        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                        gPush(); // third finger bone
                        {
                            gScale(1/0.5, 1/0.5, 1/0.5);

                            gTranslate(0, 0.9, 0);
                            gRotate(90, 1, 0, 0)
                            gScale(0.9, 0.9, 1.1);

                            setColor(vec4(0.4, 0.4, 0.4, 1.0));
                            drawCylinder(textureArray[1], "texture2", 1, gl.TEXTURE1); // Hand Texture
                            gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                            gPush(); // finger cap
                            {
                                gScale(1/0.9, 1/0.9, 1/1.1);
                                gRotate(-90, 1, 0, 0)

                                gTranslate(0, 0.7, 0);
                                gRotate(-90, 1, 0, 0)
                                gScale(0.5, 0.5, 0.4);

                                setColor(vec4(0.4, 0.4, 0.4, 1.0));
                                drawCone(textureArray[1], "texture2", 1, gl.TEXTURE1);
                                gl.bindTexture(gl.TEXTURE_2D, null);

                            }
                            gPop();

                        }
                        gPop();

                    }
                    gPop();
                }
                gPop() ;
            }
            gPop() ;
        }
        gPop() ;
    }

    function animateThumb(knuckle_id){

        let rotation = 0; // initialize rotation to default position
        var interval = 3;

        const thumbAnimation = { // Animation variable control
            // Thumb time series rotations

            1: { // knuckle 1 (base)
                time1: {baseRotFrom: -10, baseRotTo: -70, firstRotFrom: 0, firstRotTo: 0, secondRotFrom: 0, secondRotTo: 0},
                time2: {baseRotFrom: -70, baseRotTo: -70, firstRotFrom: 0, firstRotTo: 0, secondRotFrom: 0, secondRotTo: 0},
                time3: {baseRotFrom: -70, baseRotTo: -20, firstRotFrom: 0, firstRotTo: 0, secondRotFrom: 0, secondRotTo: 0},
                time4: {baseRotFrom: -20, baseRotTo: -20, firstRotFrom: 0, firstRotTo: 0, secondRotFrom: 0, secondRotTo: 0}
            },

            2: { //knuckle 2
                time1: {baseRotFrom: 0, baseRotTo: 0, firstRotFrom: 20, firstRotTo: 30, secondRotFrom: 0, secondRotTo: 0},
                time2: {baseRotFrom: 0, baseRotTo: 0, firstRotFrom: 30, firstRotTo: 30, secondRotFrom: 0, secondRotTo: 0},
                time3: {baseRotFrom: 0, baseRotTo: 0, firstRotFrom: 30, firstRotTo: 20, secondRotFrom: 0, secondRotTo: 0},
                time4: {baseRotFrom: 0, baseRotTo: 0, firstRotFrom: 20, firstRotTo: 20, secondRotFrom: 0, secondRotTo: 0}
            }
        };

        if(15.0 < TIME && TIME <= 18.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time1; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(18.0 < TIME && TIME <= 21.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time2; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(18.0 < TIME && TIME <= 24.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time2; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(24.0 < TIME && TIME <= 27.0) { // Time

            interval = 2;
            const rotations = thumbAnimation[knuckle_id].time3; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(27.0 < TIME && TIME <= 30.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time4; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(30.0 < TIME && TIME <= 33.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time4; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(33.0 < TIME && TIME <= 36.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time4; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(36.0 < TIME && TIME <= 39.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time4; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(39.0 < TIME && TIME <= 42.0) { // Time

            const rotations = thumbAnimation[knuckle_id].time4; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        if(42.0 < TIME ) { // Time

            const rotations = thumbAnimation[knuckle_id].time4; // Rotations per knuckle

            rotation = rotateFinger(knuckle_id, rotations.baseRotFrom, rotations.baseRotTo,
                rotations.firstRotFrom, rotations.firstRotTo, rotations.secondRotFrom,
                rotations.secondRotTo, interval);

        }

        return rotation;
    }

    function drawThumb(){

        var bRot = animateThumb(1);      // base knuckle rotation (front-to-back)
        var knckOne = animateThumb(2);  // first knuckle rotation (front-to-back)

        gScale(1/2, 1/1.4, 1/0.5);

        gTranslate(2,-0.1,0);
        gRotate(25, 1, 0, 0); // up-to-down
        gRotate(bRot, 0, 1, 0); // front-to-back bRot

        gScale(0.5,0.5,0.5);

        setColor(vec4(0.4,0.4,0.4,1.0));
        drawSphere(textureArray[4], "texture5", 4, gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

        gPush() ; // first finger bone
        {
            gScale(1 / 0.5, 1 / 0.5, 1 / 0.5);

            gTranslate(0.7, 0.6, 0);
            gRotate(90, 1, 0, 0); // sets the position of the bone
            gRotate(-50, 0, 1, 0); // sets the position of the bone


            gScale(0.9, 0.9, 1.2);

            setColor(vec4(0.4, 0.4, 0.4, 1.0));
            drawCylinder(textureArray[1], "texture2", 1, gl.TEXTURE1); // Hand Texture
            gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

            gPush() ; // second finger knuckle
            {
                gScale(1/0.9, 1/0.9, 1/1.2);
                gRotate(50, 0, 1, 0);
                gRotate(-90, 1, 0, 0);

                gTranslate(0.6, 0.5, 0);
                gRotate(knckOne, 0, 0, 1); // knckOne front-to-back
                gScale(0.45, 0.45, 0.45);

                setColor(vec4(0.4, 0.4, 0.4, 1.0));
                drawSphere(textureArray[4], "texture5", 4, gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                gPush() ; // first finger bone
                {
                    gScale(1 / 0.45, 1 / 0.45, 1 / 0.45);

                    gTranslate(0.4, 0.45, 0.2);
                    gRotate(90, 1, 0, 0);
                    gRotate(-40, 0, 1, 0);
                    gRotate(20, 1, 0, 0);

                    gScale(0.9, 0.9, 0.7);

                    setColor(vec4(0.4, 0.4, 0.4, 1.0));
                    drawCylinder(textureArray[1], "texture2", 1, gl.TEXTURE1); // Hand Texture
                    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                    gPush(); // finger cap
                    {
                        gScale(1/0.9, 1/0.9, 1/0.7);
                        gRotate(-90, 1, 0, 0)

                        gTranslate(0, 0.55, 0);
                        gRotate(-90, 1, 0, 0);
                        gScale(0.45, 0.45, 0.4);

                        setColor(vec4(0.4, 0.4, 0.4, 1.0));
                        drawCone(textureArray[1], "texture2", 1, gl.TEXTURE1);
                        gl.bindTexture(gl.TEXTURE_2D, null);

                    }
                    gPop();
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }

    function animateBall(){

        let translateX = 0;
        let translateY = 0;
        let translateZ = 0;

        let interval = 3;

        const ballAnimation = { // Animation variable control
            // Palm time series translations

            time0: { distanceX: 0, distanceY: 0, distanceZ: 0 }, // Don't move
            time1: { distanceX: 0, distanceY: 8, distanceZ: 0 },
            time2: { distanceX: 0, distanceY: -8, distanceZ: 0 },

        };

        if(18.0 < TIME && TIME <= 21.0) { // Time

            translateX = setTranslation(interval, ballAnimation.time1.distanceX)
            translateY = setTranslation(interval, ballAnimation.time1.distanceY)
            translateZ = setTranslation(interval, ballAnimation.time1.distanceZ)

        }

        if(21.0 < TIME && TIME <= 24.0) { // Time

            gTranslate(0,8,0) // translate to current ball position

            translateX = setTranslation(interval, ballAnimation.time0.distanceX)
            translateY = setTranslation(interval, ballAnimation.time0.distanceY)
            translateZ = setTranslation(interval, ballAnimation.time0.distanceZ)

        }

        if(24.0 < TIME && TIME <= 27.0) { // Time

            interval = 1;

            gTranslate(0,8,0) // translate to current ball position

            translateX = setTranslation(interval, ballAnimation.time2.distanceX)
            translateY = setTranslation(interval, ballAnimation.time2.distanceY)
            translateZ = setTranslation(interval, ballAnimation.time2.distanceZ)

        }


        gTranslate(translateX,translateY,translateZ);

    }
    /*************************** End of Useful Functions ***************************/

    /************************* Scene Set Up *************************/

    // Position everything relative to the center of the screen
    gTranslate(-4,0,0) ;

    // Ball
    gPush() ;
    {
        gTranslate(2.8,-4,0);

        animateBall();
        gScale(2,2,2);

        setColor(vec4(0.4,0.4,0.4,1.0));

        //drawSphere();
        drawSphere(textureArray[2], "texture3", 2, gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture
    }
    gPop() ;
    // Ground
    gPush() ;
    {
        gTranslate(4,-8,0);
        gScale(19,2,10);
        setColor(vec4(0.0,0.0,0.0,1.0));

        drawCube(textureArray[3], "texture4", 3, gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture
    }
    gPop() ;

    /************************* End of Scene Setup *************************/

    /******************************Start of Hand Code*******************************/

    gPush() ; // Start of Hand
    {
        gTranslate(3.5,1,-8);
        gRotate(80,1,0,0)

        animatePalm();
        gScale(2.8,2.5,0.7);

        setColor(vec4(0.0,1.0,0.0,1.0)) ;

        drawCube(textureArray[1],"texture2", 1, gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture


        gPush() ; // first finger base
        {
            drawFinger(1, 2.3);
        }
        gPop() ;

        gPush() ; // second finger base
        {
            drawFinger(2,0.75);
        }
        gPop() ;

        gPush() ; // third finger base
        {
            drawFinger(3, -0.75);
        }
        gPop() ;


        gPush() ; // fourth finger base
        {
            drawFinger(4, -2.3);
        }
        gPop() ;

        gPush() ; // Thumb base
        {
            drawThumb();
        }
        gPop() ;

    }
    gPop() ; // End of Hand

    /******************************End of Hand Code*******************************/

    /******************************Start of Lamp Code*******************************/

    gPush(); // Lamp Base
    {
        gTranslate(18,-5.8,4);
        gRotate(70, 0,1,0);
        gScale(4,0.3,2);

        drawCube(textureArray[5], "texture6", 5, gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

        gPush(); // aesthetic base
        {
            gScale(1/4,1/0.3,1/2);

            gTranslate(0,0.3,0);
            gScale(1.5,0.3,0.8);

            drawCube(textureArray[5], "texture6", 5, gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

            gPush(); // aesthetic base 2
            {
                gScale(1/1.5,1/0.3,1/0.8);

                gTranslate(0,0.5,0);
                gRotate(90, 0,1,0);
                gScale(0.5,0.5,1.1);

                drawCylinder(textureArray[5], "texture6", 5, gl.TEXTURE5);
                gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                gPush(); // first base arm
                {
                    gScale(1/0.5,1/0.5,1/1.1);
                    gRotate(-90, 0,1,0);

                    gTranslate(0.5,3.5,2);
                    gRotate(120, 1,0,0);

                    gScale(0.5,0.5,8.5);

                    drawCylinder(textureArray[5], "texture6", 5, gl.TEXTURE5);
                    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                    gPush(); // second arm
                    {
                        gScale(1/0.5,1/0.5,1/8.5);
                        gRotate(-120, 1,0,0);

                        gTranslate(-0.5,7,-1);
                        gRotate(50, 1,0,0);
                        gScale(0.5,0.5,10);

                        drawCylinder(textureArray[5], "texture6", 5, gl.TEXTURE5);
                        gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                        gPush(); // Lamp Head
                        {
                            gScale(1/0.5,1/0.5,1/10);
                            gRotate(-50, 1,0,0);

                            gTranslate(0,4,-3);
                            gRotate(-40, 1,0,0);
                            gScale(1.5,1.5,5);

                            drawCone(textureArray[4], "texture5", 4, gl.TEXTURE4);
                            gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture

                            gPush(); // Lamp light
                            {
                                gScale(1/1.5,1/1.5,1/5);
                                gRotate(40, 1,0,0);

                                gTranslate(0,-1,-1);
                                gScale(0.9,0.9,0.9);

                                drawSphere(textureArray[1], "texture2", 1, gl.TEXTURE1);
                                gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture
                            }
                            gPop();
                        }
                        gPop();
                    }
                    gPop();
                }
                gPop();

                gPush(); // second base arm
                {
                    gScale(1/0.5,1/0.5,1/1.1);
                    gRotate(-90, 0,1,0);

                    gTranslate(-0.5,3.5,2);
                    gRotate(120, 1,0,0);
                    gScale(0.5,0.5,8.5);

                    drawCylinder(textureArray[5], "texture6", 5, gl.TEXTURE5);
                    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture
                }
                gPop();
            }
            gPop();
        }
        gPop();
    }
    gPop();

    /******************************End of Lamp Code*******************************/

    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;

    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function(ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function(ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function(ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };

}









