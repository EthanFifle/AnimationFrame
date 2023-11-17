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

function initTextures() {

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"sunset.bmp") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"cubetexture.png") ;

    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],image2) ;


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
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}


// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

function drawCylinder() {
    setMV() ;
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

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    eye = vec3(0,0,25);
    eye[1] = eye[1] + 0 ;

    let distance = 10; // adjust this value to control the distance of the camera
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
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;

    }


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture3"), 2);

    /****************************** Useful Functions* ******************************/

    // Rotates an object from angle a to angle b in a set time interval
    // Also set the speed (in terms of frequency) between oscillations
    function setRotation(time, a, b, interval) {
        // Calculate the progress of time within the duration
        const progress = Math.min(1, time / interval);

        // Linear interpolation (lerp) between a and b
        return a + (b - a) * progress;
    }

    // Set the translation speed and distance
    function setTranslation( time, speed, distance ) {

        return Math.cos(time * speed ) * distance;
    }

    // Animation handler for all things time
    function animateHand(time, a, b){

        if(time <= 3.0){
            return setRotation(time, a, b, 2);
        }

        return 0;
    }

    function drawFinger(fig_id, base, time){

        var bRot = 0;
        var rKnckOne = 0;
        var rKnckTwo = 0;

        if (fig_id === 1){
            bRot = 30;
            rKnckOne = animateHand(time, 0, 30);
            rKnckTwo = animateHand(time, 0, 50);
        } else if (fig_id === 2){
            bRot = 50;
            rKnckOne = animateHand(time, 0, 40);
            rKnckTwo = animateHand(time, 0, 60);
        } else if (fig_id === 3){
            bRot = 70;
            rKnckOne = animateHand(time, 0, 50);
            rKnckTwo = animateHand(time, 0, 70);
        } else if (fig_id === 4){
            bRot = 80;
            rKnckOne = animateHand(time, 0, 60);
            rKnckTwo = animateHand(time, 0, 80);
        }

        // Base
        gScale(1/3, 1/2.5, 1/0.7);

        gTranslate(base,3,0);
        gRotate(animateHand(time, 0, bRot), 1,0,0)
        gScale(0.6,0.6,0.6);

        setColor(vec4(0.4,0.4,0.4,1.0));
        drawSphere();

        gPush() ; // first finger bone
        {
            gScale(1/0.6,1/0.6,1/0.6) ;
            gTranslate(0,1.3,0);
            gRotate(90,1,0,0)

            gScale(1.1,1.1,1.8);

            setColor(vec4(0.4,0.4,0.4,1.0));
            drawCylinder();


            gPush() ; // second finger knuckle
            {
                gScale(1/1.1 , 1/1.1 , 1/1.8);
                gRotate(-90,1,0,0)

                gTranslate(0, 1.1, 0);
                gRotate(rKnckOne, 1, 0,0); // Front-to back finger rotation
                gScale(0.5, 0.5, 0.5);

                setColor(vec4(0.4, 0.4, 0.4, 1.0));
                drawSphere();

                gPush(); // second finger bone
                {
                    gScale(1/0.5,1/0.5,1/0.5);

                    gTranslate(0,1.1,0);
                    gRotate(90,1,0,0)
                    gScale(1,1,1.5);

                    setColor(vec4(0.4,0.4,0.4,1.0));
                    drawCylinder();

                    gPush() ; // third finger knuckle
                    {
                        gScale(1, 1, 1 / 1.5);
                        gRotate(-90, 1, 0, 0)

                        gTranslate(0, 1, 0);
                        gRotate(rKnckTwo, 1, 0,0);
                        gScale(0.5, 0.5, 0.5);

                        setColor(vec4(0.4, 0.4, 0.4, 1.0));
                        drawSphere();

                        gPush(); // third finger bone
                        {
                            gScale(1/0.5, 1/0.5, 1/0.5);

                            gTranslate(0, 0.9, 0);
                            gRotate(90, 1, 0, 0)
                            gScale(0.9, 0.9, 1.1);

                            setColor(vec4(0.4, 0.4, 0.4, 1.0));
                            drawCylinder();

                            gPush(); // finger cap
                            {
                                gScale(1/0.9, 1/0.9, 1/1.1);
                                gRotate(-90, 1, 0, 0)

                                gTranslate(0, 0.7, 0);
                                gRotate(-90, 1, 0, 0)
                                gScale(0.5, 0.5, 0.4);

                                setColor(vec4(0.4, 0.4, 0.4, 1.0));
                                drawCone();

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

    /*************************** End of Useful Functions ***************************/



    /************************* Scene Set Up *************************/

    // Position everything relative to the center of the screen
    gTranslate(-4,0,0) ;
    // Ball
    gPush() ;
    {
        gTranslate(2.8,-4,0);
        gScale(2,2,2);
        setColor(vec4(0.4,0.4,0.4,1.0));
        drawSphere();
    }
    gPop() ;
    // Ground
    gPush() ;
    {
        gTranslate(4,-8,0);
        gScale(19,2,10);
        setColor(vec4(0.0,0.0,0.0,1.0));
        drawCube();
    }
    gPop() ;

    /************************* End of Scene Setup *************************/

    /******************************Start of Code of Hand*******************************/


    gPush() ; // Start of Hand
    {
        gTranslate(4,0,-4);

        gRotate(TIME*180/3.14159,0,1,0);
        gScale(2.8,2.5,0.7);

        setColor(vec4(0.0,1.0,0.0,1.0)) ;
        drawCube() ;


        gPush() ; // first finger base
        {
            drawFinger(1, 2.3, TIME);
        }
        gPop() ;

        gPush() ; // second finger base
        {
            drawFinger(2,0.75, TIME);
        }
        gPop() ;

        gPush() ; // third finger base
        {
            drawFinger(3, -0.75, TIME);
        }
        gPop() ;


        gPush() ; // fourth finger base
        {
            drawFinger(4, -2.3, TIME);
        }
        gPop() ;

        gPush() ; // Thumb base
        {
            gScale(1/2, 1/1.4, 1/0.5);
            gTranslate(2,-0.1,0);
            gScale(0.5,0.5,0.5);

            setColor(vec4(0.4,0.4,0.4,1.0));
            drawSphere();

            gPush() ; // first finger bone
            {
                gScale(1 / 0.5, 1 / 0.5, 1 / 0.5);

                gTranslate(0.7, 0.6, 0);
                gRotate(90, 1, 0, 0);
                gRotate(-50, 0, 1, 0);

                gScale(0.9, 0.9, 1.2);

                setColor(vec4(0.4, 0.4, 0.4, 1.0));
                drawCylinder();

                gPush() ; // second finger knuckle
                {
                    gScale(1/0.9, 1/0.9, 1/1.2);
                    gRotate(50, 0, 1, 0);
                    gRotate(-90, 1, 0, 0);

                    gTranslate(0.6, 0.5, 0);
                    gScale(0.45, 0.45, 0.45);

                    setColor(vec4(0.4, 0.4, 0.4, 1.0));
                    drawSphere();

                    gPush() ; // first finger bone
                    {
                        gScale(1 / 0.45, 1 / 0.45, 1 / 0.45);

                        gTranslate(0.4, 0.45, 0.2);
                        gRotate(90, 1, 0, 0);
                        gRotate(-40, 0, 1, 0);
                        gRotate(20, 1, 0, 0);

                        gScale(0.9, 0.9, 0.7);

                        setColor(vec4(0.4, 0.4, 0.4, 1.0));
                        drawCylinder();

                        gPush(); // finger cap
                        {
                            gScale(1/0.9, 1/0.9, 1/0.7);
                            gRotate(-90, 1, 0, 0)

                            gTranslate(0, 0.55, 0);
                            gRotate(-90, 1, 0, 0)
                            gScale(0.45, 0.45, 0.4);

                            setColor(vec4(0.4, 0.4, 0.4, 1.0));
                            drawCone();

                        }
                        gPop();
                    }
                    gPop();
                }
                gPop();
            }
            gPop();
        }
        gPop() ;

    }
    gPop() ; // End of Hand


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









