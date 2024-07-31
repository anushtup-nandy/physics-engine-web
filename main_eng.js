import * as THREE from 'three';
import { OrbitControls } from 'three/Addons.js';
import { DragControls } from 'three/DragControls';
import {Ball, Block} from '/src/rigidbodies.js';

let physicsWorld, scene, camera, renderer, clock, gridHelper, axeshelper;
let rigidBodies = [], tmpTrans = null;
let orbitControls, raycaster, mouse, moveMouse;
let isDragging = false;
let dragControls;
let draggableObjects = [];
let previewScene, previewCamera, previewRenderer, previewObject;
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
    setupPreview();
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
    
    document.getElementById('customizeButton').addEventListener('click', () => {
        document.getElementById('customizePopup').style.display = 'block';
    });

    document.querySelector('.popup .close').addEventListener('click', () => {
        document.getElementById('customizePopup').style.display = 'none';
    });

    document.getElementById('customizeForm').addEventListener('input', updatePreview);

    document.getElementById('customizeForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const objectType = document.getElementById('objectType').value;
        const color = document.getElementById('color').value;
        const width = parseFloat(document.getElementById('width').value);
        const height = parseFloat(document.getElementById('height').value);
        const depth = parseFloat(document.getElementById('depth').value);
        
        if (objectType === 'Ball') {
            const ball = new Ball(physicsWorld, draggableObjects, rigidBodies, scene, {
                x: 0, y: 10, z: 0,
                radius: width, // Assuming radius is set using width
                color: color
            });
            ball.create();
        } else if (objectType === 'Block') {
            const block = new Block(physicsWorld, draggableObjects, rigidBodies, scene, {
                x: 0, y: 10, z: 0,
                width: width, height: height, depth: depth,
                color: color
            });
            block.create();
        }

        document.getElementById('customizePopup').style.display = 'none';
    });

    // Update slider value display
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', (event) => {
            const id = event.target.id;
            document.getElementById(id + 'Value').textContent = event.target.value;
        });
    });

    window.addEventListener('resize', onWindowResize);
}

function setupPreview() {
    previewScene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0x404040);
    previewScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    previewScene.add(directionalLight);

    previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    previewCamera.position.set(0, 0, 5);

    previewRenderer = new THREE.WebGLRenderer();
    previewRenderer.setPixelRatio(window.devicePixelRatio);

    const pvCont = document.getElementById('previewContainer');
    pvCont.appendChild(previewRenderer.domElement);

    // Ensure renderer size is correct after append
    requestAnimationFrame(() => {
        resizePreviewRenderer();
        updatePreview();
    });
}

function resizePreviewRenderer() {
    const pvCont = document.getElementById('previewContainer');
    const width = pvCont.clientWidth;
    const height = pvCont.clientHeight;
    previewRenderer.setSize(width, height);
    previewCamera.aspect = width / height;
    previewCamera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
    resizePreviewRenderer();
    onWindowResize();
});

function updatePreview() {
    const objectType = document.getElementById('objectType').value;
    const color = document.getElementById('color').value;
    const width = parseFloat(document.getElementById('width').value);
    const height = parseFloat(document.getElementById('height').value);
    const depth = parseFloat(document.getElementById('depth').value);

    document.getElementById('widthValue').textContent = width;
    document.getElementById('heightValue').textContent = height;
    document.getElementById('depthValue').textContent = depth;

    // Clear previous preview object
    if (previewObject) {
        previewScene.remove(previewObject);
    }

    let geometry;
    if (objectType === 'Ball') {
        geometry = new THREE.SphereGeometry(width, 32, 32);
    } else if (objectType === 'Block') {
        geometry = new THREE.BoxGeometry(width, height, depth);
    }

    const material = new THREE.MeshStandardMaterial({ color });
    previewObject = new THREE.Mesh(geometry, material);
    previewScene.add(previewObject);

    // Render the scene
    previewRenderer.render(previewScene, previewCamera);
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
    previewRenderer.render(previewScene, previewCamera); // Render preview
    requestAnimationFrame(renderFrame);
}