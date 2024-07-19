import * as THREE from 'three';
import { OrbitControls } from 'three/Addons.js';
import * as dat from 'dat.gui';

let physicsWorld, scene, camera, renderer, clock, gridHelper, axeshelper;
let rigidBodies = [], tmpTrans = null;
let orbitControls, gui, raycaster, mouse, moveMouse, draggable,selectedObject = null, offset = new THREE.Vector3();
let isDragging = false;

Ammo().then(start);

function start() {
    tmpTrans = new Ammo.btTransform();
    setupPhysicsWorld();
    setupGraphics();
    setupEventHandlers();
    renderFrame();
}

function setupPhysicsWorld() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    // Create a ground plane shape
    let groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0); // plane normal (0, 1, 0), plane constant 0 (y = 0)

    // Create ground plane rigid body
    let groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
    groundTransform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1)); // no rotation

    let groundMass = 0; // static object, so mass is 0
    let localInertia = new Ammo.btVector3(0, 0, 0);
    let motionState = new Ammo.btDefaultMotionState(groundTransform);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, motionState, groundShape, localInertia);

    let groundBody = new Ammo.btRigidBody(rbInfo);
    // groundBody.userData.ground = true;
    physicsWorld.addRigidBody(groundBody);
}

function setupGraphics() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 50);

    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    let dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    let d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 13500;
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-container').appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;

    //orbitcontrols
    orbitControls = new OrbitControls(camera, renderer.domElement);
    
    //raycaster
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(); //x and y position of mouse
    moveMouse = new THREE.Vector2(); //will contain information regarding last mouse movement
    draggable = new THREE.Object3D; //contains the last selected object to drag

    axeshelper = new THREE.AxesHelper(10);
    scene.add(axeshelper);
    gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);
}

function setupEventHandlers() {
    document.getElementById('addBall').addEventListener('click', createBall);
    document.getElementById('addBlock').addEventListener('click', createBlock);
    window.addEventListener('resize', onWindowResize);
    // window.addEventListener('click', onClickEvent);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

}

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object.userData.draggable) {
        draggable = intersects[0].object;
        isDragging = true;
        orbitControls.enabled = false;
    }
}

function onMouseMove(event) {
    if (isDragging) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(gridHelper);

        if (intersects.length > 0) {
            draggable.position.copy(intersects[0].point);
            draggable.userData.physicsBody.setMotionState(new Ammo.btDefaultMotionState(new Ammo.btTransform().setFromOpenGLMatrix(new Float32Array(draggable.matrixWorld.elements))));
        }
    }
}

function onMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        draggable = null;
        orbitControls.enabled = true;
    }
}

// function onClickEvent(event)
// {
//     if (draggable)
//     {
//         console.log(`dropping draggable ${draggable.userData.name}`);
//         draggable = null;
//         return;
//     }
//     mouse.x = (event.clientX/window.innerWidth)*2-1;
//     mouse.y = (event.clientY/window.innerHeight)*2-1;

//     raycaster.setFromCamera(mouse, camera);
//     const intersects = raycaster.intersectObjects( scene.children );

//     if (intersects.length > 0 && intersects[0].object.userData.draggable)
//     {
//         draggable = interscts[0].object;
//         console.log(`found draggable ${draggable.userData.name}`);

//     }
// }

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createBall() {
    let pos = { x: 0, y: 10, z: 0 };
    let radius = 1.5;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 1;

    let ball = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshPhongMaterial({ color: 0x800080 }));
    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    // ball.userData.tag = 'draggable';
    scene.add(ball);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(4);
    body.setRollingFriction(10);
    physicsWorld.addRigidBody(body);
    // rigidBodies.push(ball);
    rigidBodies.push({ threeObject: ball, ammoBody: body });

    ball.userData.physicsBody = body;
    ball.userData.draggable = true;
    ball.userData.name = "BALL";
    body.threeObject = ball;
}

function createBlock() {
    let pos = { x: 0, y: 10, z: 0 };
    let scale = { x: 2, y: 2, z: 2 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 2;

    let block = new THREE.Mesh(new THREE.BoxGeometry(scale.x, scale.y, scale.z), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    block.position.set(pos.x, pos.y, pos.z);
    block.castShadow = true;
    block.receiveShadow = true; 
    scene.add(block);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(4);
    body.setRollingFriction(10);
    physicsWorld.addRigidBody(body);
    // rigidBodies.push(block);
    rigidBodies.push({ threeObject: block, ammoBody: body });

    block.userData.physicsBody = body;
    block.userData.draggable = true;
    block.userData.name = "BLOCK";
    body.threeObject = block;
}

function updatePhysics(deltaTime) {
    physicsWorld.stepSimulation(deltaTime, 10);

    for (let i = 0; i < rigidBodies.length; i++) {
        // let objThree = rigidBodies[i];
        // let objAmmo = objThree.userData.physicsBody;
        let objThree = rigidBodies[i].threeObject;
        let objAmmo = rigidBodies[i].ammoBody;
        let ms = objAmmo.getMotionState();
        if (ms) {
            ms.getWorldTransform(tmpTrans);
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }
}

// Collision detection setup
function setupCollisionDetection() {
    const dispatcher = physicsWorld.getDispatcher();
    const numManifolds = dispatcher.getNumManifolds();
    
    for (let i = 0; i < numManifolds; i++) {
        const contactManifold = dispatcher.getManifoldByIndexInternal(i);
        const numContacts = contactManifold.getNumContacts();
        
        for (let j = 0; j < numContacts; j++) {
            const contactPoint = contactManifold.getContactPoint(j);
            if (contactPoint.getDistance() < 0) {
                const objA = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
                const objB = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);
                
                if (objA.threeObject && objB.threeObject) {
                    console.log('Collision detected between', objA.threeObject.userData.tag, 'and', objB.threeObject.userData.tag);
                }
            }
        }
    }
}

function renderFrame() {
    let deltaTime = clock.getDelta();
    // fPControls.update(deltaTime);
    orbitControls.update(deltaTime);
    updatePhysics(deltaTime);
    setupCollisionDetection();
    renderer.render(scene, camera);
    // requestAnimationFrame(renderFrame);
    renderer.setAnimationLoop(renderFrame);
}