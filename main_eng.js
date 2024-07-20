import * as THREE from 'three';
import { OrbitControls } from 'three/Addons.js';
import { DragControls } from 'three/DragControls';
import {Ball, Block} from '/src/rigidbodies.js';
import * as dat from 'dat.gui';

let physicsWorld, scene, camera, renderer, clock, gridHelper, axeshelper;
let rigidBodies = [], tmpTrans = null;
let orbitControls, raycaster, mouse, moveMouse;
let isDragging = false;
let dragControls;
let draggableObjects = [];
let gui;
let selectedObject = null;
let selectedParams = {
    color: '#ffffff',
    radius: 1,
    width: 1,
    height: 1,
    depth: 1
};

Ammo().then(start);

function start() {
    tmpTrans = new Ammo.btTransform();
    setupPhysicsWorld();
    setupGraphics();
    setupEventHandlers();
    setupGUI();
    renderFrame();
}

function setupPhysicsWorld() {
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    let groundShape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(0, 1, 0), 0);

    let groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
    groundTransform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

    let groundMass = 0;
    let localInertia = new Ammo.btVector3(0, 0, 0);
    let motionState = new Ammo.btDefaultMotionState(groundTransform);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(groundMass, motionState, groundShape, localInertia);

    let groundBody = new Ammo.btRigidBody(rbInfo);
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

    orbitControls = new OrbitControls(camera, renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    moveMouse = new THREE.Vector2();

    dragControls = new DragControls(draggableObjects, camera, renderer.domElement);
    dragControls.addEventListener('dragstart', onDragStart);
    dragControls.addEventListener('dragend', onDragEnd);
    dragControls.addEventListener('drag', onDrag);

    axeshelper = new THREE.AxesHelper(10);
    scene.add(axeshelper);
    gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);
}

function setupEventHandlers() {
    document.getElementById('addBall').addEventListener('click', () => {
        const ball = new Ball(physicsWorld, draggableObjects, rigidBodies, scene, {
            x: 0, y: 10, z: 0,
            radius: 1.5,
            color: '#800080'
        });
        ball.create();
    });

    document.getElementById('addBlock').addEventListener('click', () => {
        const block = new Block(physicsWorld, draggableObjects, rigidBodies, scene, {
            x: 0, y: 10, z: 0,
            width: 2, height: 2, depth: 2,
            color: '#00ff00'
        });
        block.create();
    });

    window.addEventListener('resize', onWindowResize);
}

function setupGUI() {
    gui = new dat.GUI();

    const objectFolder = gui.addFolder('Selected Object');

    objectFolder.addColor(selectedParams, 'color').onChange((value) => {
        if (selectedObject) {
            selectedObject.material.color.set(value);
        }
    });

    objectFolder.add(selectedParams, 'radius', 0.5, 5).onChange((value) => {
        if (selectedObject && selectedObject.userData.tag === 'BALL') {
            selectedObject.scale.set(value, value, value);
            selectedObject.userData.physicsBody.setCollisionShape(new Ammo.btSphereShape(value / 2));
            selectedObject.userData.physicsBody.activate();
        }
    }).listen();

    objectFolder.add(selectedParams, 'width', 0.5, 5).onChange((value) => {
        if (selectedObject && selectedObject.userData.tag === 'BLOCK') {
            selectedObject.scale.x = value;
            selectedObject.userData.physicsBody.setCollisionShape(new Ammo.btBoxShape(new Ammo.btVector3(value / 2, selectedObject.scale.y / 2, selectedObject.scale.z / 2)));
            selectedObject.userData.physicsBody.activate();
        }
    }).listen();

    objectFolder.add(selectedParams, 'height', 0.5, 5).onChange((value) => {
        if (selectedObject && selectedObject.userData.tag === 'BLOCK') {
            selectedObject.scale.y = value;
            selectedObject.userData.physicsBody.setCollisionShape(new Ammo.btBoxShape(new Ammo.btVector3(selectedObject.scale.x / 2, value / 2, selectedObject.scale.z / 2)));
            selectedObject.userData.physicsBody.activate();
        }
    }).listen();

    objectFolder.add(selectedParams, 'depth', 0.5, 5).onChange((value) => {
        if (selectedObject && selectedObject.userData.tag === 'BLOCK') {
            selectedObject.scale.z = value;
            selectedObject.userData.physicsBody.setCollisionShape(new Ammo.btBoxShape(new Ammo.btVector3(selectedObject.scale.x / 2, selectedObject.scale.y / 2, value / 2)));
            selectedObject.userData.physicsBody.activate();
        }
    }).listen();

    objectFolder.open();

    dragControls.addEventListener('hoveron', function (event) {
        selectedObject = event.object;
        selectedParams.color = `#${selectedObject.material.color.getHexString()}`;
        if (selectedObject.userData.tag === 'BALL') {
            selectedParams.radius = selectedObject.scale.x;
        } else if (selectedObject.userData.tag === 'BLOCK') {
            selectedParams.width = selectedObject.scale.x;
            selectedParams.height = selectedObject.scale.y;
            selectedParams.depth = selectedObject.scale.z;
        }
        gui.updateDisplay();
    });

    dragControls.addEventListener('hoveroff', function () {
        selectedObject = null;
    });
}

function onDragStart(event) {
    isDragging = true;
    orbitControls.enabled = false;
    console.log(`Dragging object ${event.object.userData.tag}`);
}

function onDragEnd(event) {
    isDragging = false;
    orbitControls.enabled = true;
    console.log(`Stopped dragging object ${event.object.userData.tag}`);
}

function onDrag(event) {
    let obj = event.object;
    let pos = obj.position;
    let physicsBody = obj.userData.physicsBody;

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

    physicsBody.setWorldTransform(transform);
    physicsBody.activate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePhysics(deltaTime) {
    physicsWorld.stepSimulation(deltaTime, 10);

    for (let i = 0; i < rigidBodies.length; i++) {
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
    orbitControls.update(deltaTime);
    updatePhysics(deltaTime);
    setupCollisionDetection();
    renderer.render(scene, camera);
    renderer.setAnimationLoop(renderFrame);
}