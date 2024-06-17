//NOTE:
//No need to import since entire module is downloaded and added to ./js

//variables
let physicsWorld, scene, camera, renderer, rigidBodies = [], pos = new THREE.Vector3(), tmpTrans = null;
let mouseCoords = new THREE.Vector2(), raycaster = new THREE.Raycaster();
let wall, ball;
let ttl = 3, ttlCounter = 0, ballInWorld = false;

const STATE = { DISABLE_DEACTIVATION : 4 };

Ammo().then(start)

function start()
{
	tmpTrans = new Ammo.btTransform();
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

function setupGraphics()
{
	//clock
	clock = new THREE.Clock();
	//scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xabfeff);
	//camera
	camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.2, 5000);
	camera.position.set(0 , 20, 50);
	camera.lookAt(new THREE.Vector3(0, 20, 0));
	//add directional light
	let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
                hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
                hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
                hemiLight.position.set( 0, 50, 0 );
                scene.add( hemiLight );
	//add directional light
}

function setupGraphics() {
    // create clock for timing
    clock = new THREE.Clock();

    // create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    // create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 5000);
    camera.position.set(0, 30, 70);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

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

	//controls:
	//const controls = new OrbitControls( camera, renderer.domElement );

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
	let deltaTime = clock.getDelta();
	//update balltime to live if ball in the world
	if (ballInWorld) ttlCounter +=deltaTime;
	//if time limit exceeded delete the ball
	if (ttlCounter> ttl) 
	{
		physicsWorld.removeRigidBody(ball.userData.physicsBody);
		scene.remove(ball);
		ttlCounter = 0;
		ballInWorld = false;
	}
	updatePhysics(deltaTime);
	renderer.render(scene, camera);
	requestAnimationFrame(renderFrame);
}

function setupEventHandlers()
{
	window.addEventListener('resize', onWindowResize, false);
	winow.addEventListener('mousedown', onMousedown, false);
}

function onWindowResize()
{
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMousedown(event)
{
	if (ballInWorld)
}

