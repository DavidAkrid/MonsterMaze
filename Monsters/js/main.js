var renderer;
var scene;
var camera;
var controls;

var raycaster;
var blocker;
var instructions;

var objects = [];
var randoms = [];
var score = 0;
var mouse = {x:0,y:0};
var cameraMoves = {x:0,y:0,z:-0.1,move:false,speed:0.2};

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var controlsEnabled = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var gameoverflag = true;
var coefficient = 25;

var maze1 = [
    'X X X X X X X X X X X X X X X X X X X X X X',
    'X         K             X           K     X',
    'X X X X X   X   X X X   X   X X   X X X   X',
    'X           X   K   X   X   X           M X',
    'X K X X X   X X X   X   X   X   X     X X X',
    'X                                       K X',
    'X X X X X   X X X X X   X   X X X     X X X',
    'X               X M           X         X X',
    'X K                     X           X     X',
    'X X X X X   X X K X X   X X X X X X X   K X',
    'X                       X K X M     X   X X',
    'X                               X       X X',
    'X   X X X   X   X   X   X X X X X X X   X X',
    'X   X       X   K   X                     X',
    'X   M K X   X       X   X K X M X K X     X',
    'X X X X X X X X E X X X X X X X X X X X X X',
    '                A                          '

];

var winMaze = [
    'X X X X X X',
    'X   K   E A',
    'X X X X X X'

];

var loseMaze = [
    'X X X X X X',
    'X       M X',
    'X X X X X X'

];

var observeMaze = [
    'X X X X X X X X',
    'X             X',
    'X   X X X X   X',
    'X   X     X   X',
    'X   X M   X   X',
    'X   X X X X   X',
    'X             X',
    'X X X X X X X X'

];

var killMaze = [
    'X X X X X X X X',
    'X           M X',
    'X             X',
    'X           M X',
    'X M   M   M   X',
    'X X X X X X X X'
]

var maze = maze1;

var devHeight = 350;
var realHeight = 150;
function init()
{
    blocker = document.getElementById( 'blocker' );
    instructions = document.getElementById( 'instructions' );


    pointerLock();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    scene.fog = new THREE.Fog( 0x000000, 0.1, 750 );

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, .1, 1000);
    camera.rotateY(Math.PI);
    controls = new THREE.PointerLockControls( camera );
    scene.add(controls.getObject() );
    controls.getObject().translateX(-coefficient);
    controls.getObject().translateZ(coefficient);
    

    var onKeyDown = function ( event ) {
        
        switch ( event.keyCode ) {
        
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
        
            case 37: // left
            case 65: // a
                moveLeft = true; break;
        
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
        
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
        
            case 32: // space
                if ( canJump === true ) velocity.y += devHeight;//350 dev height - 150 real game?
                canJump = false;
                break;
        
        }
        
        //updatePosition()
    };

    var onKeyUp = function ( event ) {
        
        switch( event.keyCode ) {
        
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
        
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
        
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
        
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        
        }
        
        //updatePosition()
    };
        
    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    setupRenderer();
    setupCamera();

    //code here
    initFloor();
    createMaze();
    loadSounds();
	

    document.body.appendChild( renderer.domElement);

    render();
	
}

var mazeObjects = {};
function createMaze()
{
    
    mazeObjects.numKeys = 0;
    mazeObjects.numMonsters = 0;

    var x,y;
    for(var row = 0; row < maze.length; row++)
    {
        y = -row * coefficient;
        mazeObjects[row] = {};

        for(var column = 0; column < maze[row].length; column += 2)
        {
            x = column/2 * coefficient;
            var height = coefficient/2;
            var cell = maze[row][column];
            var object = null;

            if(cell === 'X')
            {
                object = createWall();
            }

            if(cell === 'K')
            {
                console.log("Key placed at (" + row + "," + column/2 + ")");
                object = createKey();
                height = 5;
            }

            if(cell === 'M')
            {
                object = createMonster();
                height = 15;
                //object.position.set(y,height,x);
                
            }
            
            if(cell === 'E')
            {
                object = createExit();
            }

            if(cell === 'A')
            {
                object = createBeg();
            }

            if(object !== null)
            {
                object.position.set(y,height,x);
                mazeObjects[row][column] = object;
                mazeObjects[row][column].collected = false;
                scene.add(mazeObjects[row][column]);
            }
        }
    }
}

function createExit()
{
    var size = 1 * coefficient;
    var loader = new THREE.TextureLoader();
    var texture = loader.load('images/exit.jpg');
    var wallGeometry = new THREE.BoxGeometry(size, size, size);
    var wallMaterial = new THREE.MeshLambertMaterial({ map:texture });

    var wall = new THREE.Mesh(wallGeometry,wallMaterial);
    //updateScore();
    return wall;
}

function createBeg()
{
    var size = 1 * coefficient;
    var loader = new THREE.TextureLoader();
    var texture = loader.load('images/beg.jpg');
    var wallGeometry = new THREE.BoxGeometry(size, size, size);
    var wallMaterial = new THREE.MeshLambertMaterial({ map:texture });

    var wall = new THREE.Mesh(wallGeometry,wallMaterial);
    //updateScore();
    return wall;
}

function createWall()
{
    var size = 1 * coefficient;
    var loader = new THREE.TextureLoader();
    var texture = loader.load('images/wall.jpg');
    var wallGeometry = new THREE.BoxGeometry(size, size, size);
    var wallMaterial = new THREE.MeshLambertMaterial({ map:texture });

    var wall = new THREE.Mesh(wallGeometry,wallMaterial);
    
    return wall;    
}

var size = 3;
var keyObjects = {};
function createKey()
{    
    var loader = new THREE.TextureLoader();
    var texture = loader.load('images/key.png');
    var keyGeometry = new THREE.PlaneGeometry( 5, 5 );
    var keyMaterial = new THREE.MeshBasicMaterial( {map:texture, side:THREE.DoubleSide, transparent:true})

    var key = new THREE.Mesh(keyGeometry,keyMaterial);
    keyObjects[mazeObjects.numKeys] = key;
    keyObjects[mazeObjects.numKeys].hoverUp = false;
    mazeObjects.numKeys++;
    
    return key;    
}

function spinKey()
{
    //traverse through all keys available
    for(var i = 0; i < mazeObjects.numKeys; i++)
    {
        keyObjects[i].rotation.y += .06;

        if(keyObjects[i].hoverUp == true)
        {
            keyObjects[i].position.y += .02;
        }
        else
        {
            keyObjects[i].position.y -= .02;
        }

        if(keyObjects[i].position.y > 5.25 || keyObjects[i].position.y < 4.5)
        {
            keyObjects[i].hoverUp = !keyObjects[i].hoverUp;
        }
    }
}

var monsterObjects = {};
function createMonster()
{
    var loader = new THREE.TextureLoader();
    var texture = loader.load('images/ball.jpg');
    var mGeometry = new THREE.SphereGeometry( 10 );
    var mMaterial = new THREE.MeshLambertMaterial({ map:texture });

    var monster = new THREE.Mesh(mGeometry,mMaterial);
    var curNum = mazeObjects.numMonsters;
    
    monsterObjects[curNum] = monster; 
    monsterObjects[curNum].hoverUp = true;

    mazeObjects.numMonsters++;
    return monsterObjects[curNum];  
}

function hoverMonsters()
{
    //traverse through all monsters available
    for(var i = 0; i < mazeObjects.numMonsters; i++)
    {
        if(monsterObjects[i].hoverUp == true)
        {
            monsterObjects[i].position.y += .03;
        }
        else
        {
            monsterObjects[i].position.y -= .03;
        }

        if(monsterObjects[i].position.y > 15.5 || monsterObjects[i].position.y < 14)
        {
            monsterObjects[i].hoverUp = !monsterObjects[i].hoverUp;
        }

        currY = -controls.getObject().position.x + (coefficient/2);
        currX = controls.getObject().position.z + (coefficient/2);   
        var xBound = monsterObjects[i].position.z + (coefficient/2);
        var yBound = -monsterObjects[i].position.x + (coefficient/2);
        var xDiff = (currX - xBound);
        var yDiff = (currY - yBound);             
        
        /*
        if((monsterObjects[i].rotation.y % (Math.PI/2)) < Math.atan(yDiff/xDiff) || (monsterObjects[i].rotation.y % (Math.PI/2)) < Math.atan(xDiff/yDiff))
        {
           monsterObjects[i].rotation.y += 0.01 
        }
        else if((monsterObjects[i].rotation.y % (Math.PI/2)) > Math.atan(yDiff/xDiff)|| (monsterObjects[i].rotation.y % (Math.PI)) > Math.atan(xDiff/yDiff))
        {
           monsterObjects[i].rotation.y -= 0.01 
        }*/
        
    }
}

var monsterMapX, monsterMapY
var monsterSpeed = .3;
function moveMonsters()
{
    //grab coordinates of player add coefficient/2 to account for offset of origin
    currY = -controls.getObject().position.x + (coefficient/2);
    currX = controls.getObject().position.z + (coefficient/2);
    
    //traverse through all monsters available
    for(var i = 0; i < mazeObjects.numMonsters; i++)
    {
        //calculate the real coordinates of the center of the square backwards from map coordinates
        var xBound = monsterObjects[i].position.z + (coefficient/2);
        var yBound = -monsterObjects[i].position.x + (coefficient/2);

        //calculate the position within the current square the monster is in
        var modX = xBound % coefficient;
        var modY = yBound % coefficient;

        //convert real coordinates to map coordinates to allow checking in original maze array
        monsterMapX = Math.trunc((xBound)/coefficient) * 2;
        monsterMapY = Math.trunc((yBound)/coefficient);

        var leftWall = false;
        var rightWall = false;
        var upWall = false;
        var downWall = false;

        if(maze[monsterMapY][monsterMapX-2] == 'X' && modX <= 10)//left wall --GOOD
        {
            leftWall = true;
        }
        if(maze[monsterMapY][monsterMapX+2] == 'X' && modX >= (coefficient - 10))//right wall --GOOD
        {
            rightWall = true;
        }
        if(maze[monsterMapY+1][monsterMapX] == 'X' && modY >= (coefficient - 10))//down wall -- GOOD
        {
            downWall = true;
        }
        if(maze[monsterMapY-1][monsterMapX] == 'X' && modY <= 10)//up wall --GOOD
        {
            upWall = true;
        }

        if(xBound > currX + 5 && leftWall == false)//monster move left
        {
            monsterObjects[i].position.z -= monsterSpeed;
        }
        else if(xBound < currX - 5 && rightWall == false)//monster move right
        {
            monsterObjects[i].position.z += monsterSpeed;
        }

        if(yBound > currY + 5 && upWall == false)//monster move up
        {
            monsterObjects[i].position.x += monsterSpeed;
        }
        else if(yBound < currY - 5 && downWall == false)//monster move down
        {
            monsterObjects[i].position.x -= monsterSpeed;
        }


    }
}

var currX,currY,mapX,mapY;
function checkCollision()
{
    //grab coordinates of player add coefficient/2 to account for offset of origin
    currY = -controls.getObject().position.x + (coefficient/2);
    currX = controls.getObject().position.z + (coefficient/2);

    //convert real coordinates to map coordinates to allow checking in original maze array
    mapX = Math.trunc(Math.round(currX)/coefficient) * 2;
    mapY = Math.trunc(Math.round(currY)/coefficient);

    if(maze[mapY][mapX] == 'X')
    {
        velocity.x = -velocity.x * 3;
        velocity.z = -velocity.z * 3;
        //mazeObjects[mapY][mapX].visible = false;
        //scene.remove(mazeObjects[mapY][mapX]);
    }

    if(maze[mapY][mapX] == 'K' && touchingKey())
    {
        //let me tell you. this suuuuucked
        mazeObjects[mapY][mapX].visible = false;
        if(mazeObjects[mapY][mapX].collected == false)
        {
            score++;
            key.play();
        }
        mazeObjects[mapY][mapX].collected = true;
        //scene.remove(mazeObjects[mapY][mapX]);
    }

    if(touchingMonsters())
    {
        gameOver('lose');
        return;
    }

    if(maze[mapY][mapX] == 'E' && (mazeObjects.numKeys - score) == 0)
    {
        gameOver('win');
    }
    else if (maze[mapY][mapX] == 'E')
    {
        velocity.x = -velocity.x * 3;
        velocity.z = -velocity.z * 3; 
    }
}

var gameOverOpacity = 1;
function gameOver(string)
{
    if(gameoverflag)
    {
        var color;
        if(string == 'lose')
        {
            lose.play();
            color = "red";
            document.getElementById("score-display").style.color = color;
            document.getElementById("h3").style.color = color;
            document.getElementById("h1").style.color = color;
            document.getElementById("h2").style.color = color;
            $("#gameover").css('z-index', 1000 );
            $("#instructions").css('z-index', 0 );
            $("#instructions").css('opacity', 0 );
            $("#gameover").css('opacity', gameOverOpacity ); 
        }
        else if(string == 'win')
        {
            win.play();
            color = "#02AA2C";
            document.getElementById("score-display").style.color = color;
            document.getElementById("h3").style.color = color;
            document.getElementById("h1").style.color = color;
            document.getElementById("h2").style.color = color;
            $("#gamewin").css('z-index', 1000 );
            $("#instructions").css('z-index', 0 );
            $("#instructions").css('opacity', 0 );
            $("#gamewin").css('opacity', gameOverOpacity );  
        }
    }

    

    gameoverflag = false;
    
    return;
}

function touchingKey()
{
    //calculate the real coordinates of the center of the square backwards from map coordinates
    var yBound = (mapY * coefficient) + (coefficient/2);
    var xBound = ((mapX/2) * coefficient) + (coefficient/2);

    //calculate difference between current coordinates and the center of the cube. If touching the key, return true
    var yDiff = Math.abs(yBound - currY);
    var xDiff = Math.abs(xBound - currX);
    if(yDiff <= size && xDiff <= size)
    {
        return true;
    }
}

function touchingMonsters()
{
    //traverse through all monsters available
    for(var i = 0; i < mazeObjects.numMonsters; i++)
    {
        //calculate the real coordinates of the center of the square backwards from map coordinates
        var xBound = monsterObjects[i].position.z + (coefficient/2);
        var yBound = -monsterObjects[i].position.x + (coefficient/2);

        //calculate difference between current coordinates and the center of the cube. If touching the monster, return true
        var yDiff = Math.abs(yBound - currY);
        var xDiff = Math.abs(xBound - currX);

        if(yDiff <= 14 && xDiff <= 14)
        {
            return true;
        }
    }
    
    return false;
}

function animate() {
    
    requestAnimationFrame( animate );
    
    if ( controlsEnabled ) {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;
    
        var intersections = raycaster.intersectObjects( objects );
    
        var isOnObject = intersections.length > 0;
    
        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;
    
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
    
        velocity.y -= 9.8 * 50.0 * delta; // 100.0 = mass

        if ( moveForward ) velocity.z -= 400.0 * delta;
        if ( moveBackward ) velocity.z += 400.0 * delta;
    
        if ( moveLeft ) velocity.x -= 400.0 * delta;
        if ( moveRight ) velocity.x += 400.0 * delta;
    
        if ( isOnObject === true ) {
            velocity.y = Math.max( 0, velocity.y );
    
            canJump = true;
        }
    
        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );
    
        if ( controls.getObject().position.y < 10 ) {
    
            velocity.y = 0;
            controls.getObject().position.y = 10;
    
            canJump = true;
    
        }
    
        prevTime = time;
    
    }
}

function pointerLock()
{
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock ) 
    {

        var element = document.body;
        
        var pointerlockchange = function ( event ) 
        {
        
            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) 
            {
        
                controlsEnabled = true;
                controls.enabled = true;
        
                blocker.style.display = 'none';
        
            } 
            else 
            {
        
                controls.enabled = false;
        
                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';
        
                instructions.style.display = '';
        
            }
        
        };
        
        var pointerlockerror = function ( event ) 
        {
        
            instructions.style.display = '';
        
        };
        
        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
        
        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
        
        instructions.addEventListener( 'click', function ( event ) 
        {
            instructions.style.display = 'none';
        
            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        
        }, false );
        
    } else {
        
        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
        
    }
}



function initFloor()
{  
   // floor
   var loader = new THREE.TextureLoader();
   var texture = loader.load('images/groundterrain.jpg');
   texture.wrapS = THREE.RepeatWrapping;
   texture.wrapT = THREE.RepeatWrapping;
   texture.repeat.set( 50, 50 );
   geometry = new THREE.PlaneGeometry( 2000, 2000 );
  
   material = new THREE.MeshLambertMaterial( { map: texture } );
   geometry.rotateX( - Math.PI / 2 );
 
   mesh = new THREE.Mesh( geometry, material );
   scene.add( mesh );
 
   createSpotlight(3*coefficient,20,3*coefficient);
}

function createSpotlight(x,y,z)
{
    var spotLight, ambient = new THREE.AmbientLight(0x888888);

    ambient.intensity = .75;
    scene.add(ambient);
    spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( x, y, z );
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 100;
    spotLight.castShadow = true;
    spotLight.intensity = .5;
    //scene.add(spotLight);
}

function setupRenderer()
{
    renderer = new THREE.WebGLRenderer();

    renderer.setClearColor( 0x000000, 1.0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
}

function setupCamera()
{
    //camera.position.z = 5;
    //camera.lookAt( scene.position );
}

function updateScoreDisplay()
{
    var myDiv = document.getElementById("score-display");
    myDiv.innerHTML = mazeObjects.numKeys - score;
}

function render()
{
    if(gameoverflag)
    {
        animate();
        spinKey();
        hoverMonsters();
        moveMonsters();
        checkCollision();
        updateScoreDisplay();

        // Request animation frame
        requestAnimationFrame( render );
        
        // Call render()
        renderer.render( scene, camera );
    }
}

var key, win, lose, song;
function loadSounds()
{
    key = new Audio("sounds/key.mp3");
    win = new Audio("sounds/win.mp3");
    lose = new Audio("sounds/lose.mp3");
    song = new Audio("sounds/song.mp3");

	
    song.loop = true;
    song.volume = .2;
    song.play();
}

window.onload = init;
