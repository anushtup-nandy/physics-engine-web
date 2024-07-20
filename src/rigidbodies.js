import * as THREE from 'three';

// Function to create a ball
export function createBall(physicsWorld, draggableObjects, rigidBodies, scene) {
    let pos = { x: 0, y: 10, z: 0 };
    let radius = 1.5;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 1;

    let ball = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshPhongMaterial({ color: 0x800080 }));
    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    ball.userData.draggable = true;
    ball.userData.tag = "BALL";
    scene.add(ball);
    draggableObjects.push(ball);

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
    rigidBodies.push({ threeObject: ball, ammoBody: body });

    ball.userData.physicsBody = body;
    body.threeObject = ball;
}

// Function to create a block
export function createBlock(physicsWorld, draggableObjects, rigidBodies, scene) {
    let pos = { x: 0, y: 10, z: 0 };
    let scale = { x: 2, y: 2, z: 2 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 2;

    let block = new THREE.Mesh(new THREE.BoxGeometry(scale.x, scale.y, scale.z), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    block.position.set(pos.x, pos.y, pos.z);
    block.castShadow = true;
    block.receiveShadow = true;
    block.userData.draggable = true;
    block.userData.tag = "BLOCK";
    scene.add(block);
    draggableObjects.push(block);

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
    rigidBodies.push({ threeObject: block, ammoBody: body });

    block.userData.physicsBody = body;
    body.threeObject = block;
}