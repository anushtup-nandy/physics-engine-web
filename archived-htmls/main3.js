//variables
let physicsWorld, scene, camera, renderer, rigidBodies = [], pos = new THREE.Vector3(), tmpTrans = null;
let mouseCoords = new THREE.Vector2(), raycaster = new THREE.Raycaster();
let wall, ball;
let ttl = 3, ttlCounter = 0, ballInWorld = false;
let moveDirection = { left: 0, right: 0, forward: 0, back: 0, up: 0, down: 0 };

let cbContactResult;
let redTile, cbContactPairResult;

const STATE = { DISABLE_DEACTIVATION : 4 };

Ammo().then(start)

function start()
{
	tmpTrans = new Ammo.btTransform();
	setupPhysicsWorld();
	setupGraphics();
	createFloorTiles();
	// createWall();
	createBall();
	setupContactResultCallback();
    setupContactPairResultCallback();
	setupEventHandlers();
	renderFrame();
}

function setupPhysicsWorld()
{
	let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache = new Ammo.btDbvtBroadphase(),
		solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

function setupGraphics() {
    // create clock for timing
    clock = new THREE.Clock();

    // create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    // create camera
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.0001, 50000);
    camera.position.set(0, 20, 50);
    camera.lookAt(new THREE.Vector3(0, 20, 0));

    // Add hemisphere light
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
    hemiLight.color.setHSL(0.6, 0.6, 0.6);
    hemiLight.groundColor.setHSL(0.1, 1, 0.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // Add directional light
    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(100);
    scene.add(dirLight);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    let d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 13500;

    // Setup the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xbfd1e5);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;
}

function renderFrame()
{
	// let deltaTime = clock.getDelta();
	// //update the ball time to live if ball in world
	// if (ballInWorld) ttlCounter += deltaTime;
	// //if time limite exceeded ,then delete ball!
	// if (ttlCounter > ttl)
	// {
	// 	physicsWorld.removeRigidBody(ball.userData.physicsBody);
	// 	scene.remove(ball);
	// 	ttlCounter = 0;
	// 	ballInWorld = false;
	// }
	// updatePhysics(deltaTime);
	// renderer.render(scene, camera);
	// requestAnimationFrame( renderFrame );
	let deltaTime = clock.getDelta();
    moveBall();
    updatePhysics( deltaTime );
	renderer.render( scene, camera );
	requestAnimationFrame( renderFrame );
}

function setupEventHandlers()
{
	window.addEventListener('resize', onWindowResize, false);
	// window.addEventListener('mousedown', onMouseDown, false);
	window.addEventListener( 'keydown', handleKeyDown, false);
    window.addEventListener( 'keyup', handleKeyUp, false);
}

function onWindowResize()
{
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event)
{
	if (ballInWorld) return;
	mouseCoords.set((event.clientX/window.innerWidth)*2 -1, -(event.clientY/window.innerHeight)*2 + 1);
	raycaster.setFromCamera(mouseCoords, camera);

	//create ball
	pos.copy(raycaster.ray.direction);
	pos.add(raycaster.ray.origin);
	ball = createBall(pos);

	//shoot ball
	let ballbody = ball.userData.physicsBody;
	pos.copy(raycaster.ray);
	pos.multiplyScalar(70);
	ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
	ballInWorld = true;
}

function handleKeyDown(event){

                let keyCode = event.keyCode;

                switch(keyCode){

                    case 87: //W: FORWARD
                        moveDirection.forward = 1;
                        break;
                        
                    case 83: //S: BACK
                        moveDirection.back = 1;
                        break;
                        
                    case 65: //A: LEFT
                        moveDirection.left = 1;
                        break;
                        
                    case 68: //D: RIGHT
                        moveDirection.right = 1;
                        break;

                    case 84://T
                        checkContact();
                        break;
                                            
                    case 74://J
                        jump();
                        break;
                        
                }
            }


            function handleKeyUp(event){
                let keyCode = event.keyCode;

                switch(keyCode){
                    case 87: //W: FORWARD
                        moveDirection.forward = 0;
                        break;
                        
                    case 83: //S: BACK
                        moveDirection.back = 0;
                        break;
                        
                    case 65: //A: LEFT
                        moveDirection.left = 0;
                        break;
                        
                    case 68: //D: RIGHT
                        moveDirection.right = 0;
                        break;
                }

            }

function createFloorTiles(){
                let tiles = [
                    { name: "yellow", color: 0xFFFF00, pos: {x: -20, y: 0, z: 20} },
                    { name: "red", color: 0xFF0000, pos: {x: 20, y: 0, z: 20} },
                    { name: "green", color: 0x008000, pos: {x: 20, y: 0, z: -20} },
                    { name: "blue", color: 0x0000FF, pos: {x: -20, y: 0, z: -20} }
                ]
                
                let scale = {x: 40, y: 6, z: 40};
                let quat = {x: 0, y: 0, z: 0, w: 1};
                let mass = 0;

                for (const tile of tiles) {
                        
                    //threeJS Section
                    let pos = tile.pos;
					let mesh_pos = new THREE.BoxBufferGeometry(pos.x, pos.y, pos.z);
                    let mesh = new THREE.Mesh(mesh_pos, new THREE.MeshPhongMaterial({color: tile.color}));

                    mesh.position.set(pos.x, pos.y, pos.z);
                    mesh.scale.set(scale.x, scale.y, scale.z);

                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    mesh.userData.tag = tile.name;

                    scene.add(mesh);


                    //Ammojs Section
                    let transform = new Ammo.btTransform();
                    transform.setIdentity();
                    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
                    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
                    let motionState = new Ammo.btDefaultMotionState( transform );

                    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
                    colShape.setMargin( 0.05 );

                    let localInertia = new Ammo.btVector3( 0, 0, 0 );
                    colShape.calculateLocalInertia( mass, localInertia );

                    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
                    let body = new Ammo.btRigidBody( rbInfo );

                    body.setFriction(4);
                    body.setRollingFriction(10);

                    physicsWorld.addRigidBody( body );

                    body.threeObject = mesh;

                    if( tile.name == "red"){

                        mesh.userData.physicsBody = body;
                        redTile = mesh;

                    } 
                    
                }

            }


function createWall(){
	let pos = {x: 0, y: 25, z: -15};
	let scale = {x: 50, y: 50, z: 2 };
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 0;

	//threejs
	wall_pos = new THREE.BoxBufferGeometry(pos.x, pos.y, pos.z);
	wall = new THREE.Mesh(wall_pos, new THREE.MeshPhongMaterial({color: 0x42f5bf}));//mesh(geometry, material)

	// wall.position.set(pos.x, pos.y, pos.z);
	wall.scale.set(scale.x , scale.y, scale.z);
	wall.castShadow = true;
	wall.receiveShadow = true;
	scene.add(wall);
	
	//Ammojs
	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)); //[x, y, z, sigma]
	let motionState = new Ammo.btDefaultMotionState(transform);

	let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x*0.5, scale.y*0.5, scale.z*0.5));
	colShape.setMargin(0.05);
	
	let localInertia = new Ammo.btVector3(0, 0, 0);
	colShape.calculateLocalInertia(mass, localInertia);
	
	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );	
	body.setFriction(4);
	body.setRollingFriction(10);

        physicsWorld.addRigidBody( body );

        //Let's overlay the wall with a grid for visual calibration
	const gridHelper = new THREE.GridHelper(50, 50, 0x1111aa, 0xaa1111);

        scene.add( gridHelper );
        gridHelper.rotateX( THREE.Math.degToRad(90));
        gridHelper.position.y = 25;
	gridHelper.position.z = -14;

	wall.userData.tag = "wall";
}

function createBall(){
                
                let pos = {x: 0, y: 10, z: 0};
                let radius = 1.5;
                let quat = {x: 0, y: 0, z: 0, w: 1};
                let mass = 1;

                //threeJS Section
                ball = ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0x800080}));

                ball.position.set(pos.x, pos.y, pos.z);
                
                ball.castShadow = true;
                ball.receiveShadow = true;
                
                ball.userData.tag = "ball";

                scene.add(ball);


                //Ammojs Section
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
                transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
                let motionState = new Ammo.btDefaultMotionState( transform );

                let colShape = new Ammo.btSphereShape( radius );
                colShape.setMargin( 0.05 );

                let localInertia = new Ammo.btVector3( 0, 0, 0 );
                colShape.calculateLocalInertia( mass, localInertia );

                let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
                let body = new Ammo.btRigidBody( rbInfo );

                body.setFriction(4);
                body.setRollingFriction(10);

                body.setActivationState( STATE.DISABLE_DEACTIVATION )


                physicsWorld.addRigidBody( body );
                rigidBodies.push(ball);
                
                ball.userData.physicsBody = body;
                
                body.threeObject = ball;
                
            }

function setupContactResultCallback(){

                cbContactResult = new Ammo.ConcreteContactResultCallback();
                
                cbContactResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
                    
                    let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );

                    const distance = contactPoint.getDistance();

                    if( distance > 0 ) return;

                    let colWrapper0 = Ammo.wrapPointer( colObj0Wrap, Ammo.btCollisionObjectWrapper );
                    let rb0 = Ammo.castObject( colWrapper0.getCollisionObject(), Ammo.btRigidBody );
                    
                    let colWrapper1 = Ammo.wrapPointer( colObj1Wrap, Ammo.btCollisionObjectWrapper );
                    let rb1 = Ammo.castObject( colWrapper1.getCollisionObject(), Ammo.btRigidBody );

                    let threeObject0 = rb0.threeObject;
                    let threeObject1 = rb1.threeObject;

                    let tag, localPos, worldPos

                    if( threeObject0.userData.tag != "ball" ){

                        tag = threeObject0.userData.tag;
                        localPos = contactPoint.get_m_localPointA();
                        worldPos = contactPoint.get_m_positionWorldOnA();

                    }
                    else{

                        tag = threeObject1.userData.tag;
                        localPos = contactPoint.get_m_localPointB();
                        worldPos = contactPoint.get_m_positionWorldOnB();

                    }
                    
                    let localPosDisplay = {x: localPos.x(), y: localPos.y(), z: localPos.z()};
                    let worldPosDisplay = {x: worldPos.x(), y: worldPos.y(), z: worldPos.z()};

                    console.log( { tag, localPosDisplay, worldPosDisplay } );
                    
                }

            }


            function setupContactPairResultCallback(){

                cbContactPairResult = new Ammo.ConcreteContactResultCallback();
                
                cbContactPairResult.hasContact = false;

                cbContactPairResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
                    
                    let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );

                    const distance = contactPoint.getDistance();

                    if( distance > 0 ) return;

                    this.hasContact = true;
                    
                }

            }



            function moveBall(){

                let scalingFactor = 20;

                let moveX =  moveDirection.right - moveDirection.left;
                let moveZ =  moveDirection.back - moveDirection.forward;

                if( moveX == 0 && moveZ == 0) return;

                let resultantImpulse = new Ammo.btVector3( moveX, 0, moveZ )
                resultantImpulse.op_mul(scalingFactor);

                let physicsBody = ball.userData.physicsBody;
                physicsBody.setLinearVelocity( resultantImpulse );

            }


            function checkContact(){

                physicsWorld.contactTest( ball.userData.physicsBody , cbContactResult );

            }


            function jump(){

                cbContactPairResult.hasContact = false;

                physicsWorld.contactPairTest(ball.userData.physicsBody, redTile.userData.physicsBody, cbContactPairResult);

                if( !cbContactPairResult.hasContact ) return;

                let jumpImpulse = new Ammo.btVector3( 0, 15, 0 );

                let physicsBody = ball.userData.physicsBody;
                physicsBody.setLinearVelocity( jumpImpulse );

            }


            function updatePhysics( deltaTime ){

                // Step world
                physicsWorld.stepSimulation( deltaTime, 10 );

                // Update rigid bodies
                for ( let i = 0; i < rigidBodies.length; i++ ) {
                    let objThree = rigidBodies[ i ];
                    let objAmmo = objThree.userData.physicsBody;
                    let ms = objAmmo.getMotionState();
                    if ( ms ) {

                        ms.getWorldTransform( tmpTrans );
                        let p = tmpTrans.getOrigin();
                        let q = tmpTrans.getRotation();
                        objThree.position.set( p.x(), p.y(), p.z() );
                        objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

                    }
                }

            }
