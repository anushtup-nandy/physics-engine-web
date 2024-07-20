import * as THREE from 'three';

// Function to create a ball
// export function createBall(physicsWorld, draggableObjects, rigidBodies, scene) {
//     let pos = { x: 0, y: 10, z: 0 };
//     let radius = 1.5;
//     let quat = { x: 0, y: 0, z: 0, w: 1 };
//     let mass = 1;

//     let ball = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshPhongMaterial({ color: 0x800080 }));
//     ball.position.set(pos.x, pos.y, pos.z);
//     ball.castShadow = true;
//     ball.receiveShadow = true;
//     ball.userData.draggable = true;
//     ball.userData.tag = "BALL";
//     scene.add(ball);
//     draggableObjects.push(ball);

//     let transform = new Ammo.btTransform();
//     transform.setIdentity();
//     transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
//     transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
//     let motionState = new Ammo.btDefaultMotionState(transform);

//     let colShape = new Ammo.btSphereShape(radius);
//     colShape.setMargin(0.05);

//     let localInertia = new Ammo.btVector3(0, 0, 0);
//     colShape.calculateLocalInertia(mass, localInertia);

//     let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
//     let body = new Ammo.btRigidBody(rbInfo);
//     body.setFriction(4);
//     body.setRollingFriction(10);
//     physicsWorld.addRigidBody(body);
//     rigidBodies.push({ threeObject: ball, ammoBody: body });

//     ball.userData.physicsBody = body;
//     body.threeObject = ball;
// }

// // Function to create a block
// export function createBlock(physicsWorld, draggableObjects, rigidBodies, scene) {
//     let pos = { x: 0, y: 10, z: 0 };
//     let scale = { x: 2, y: 2, z: 2 };
//     let quat = { x: 0, y: 0, z: 0, w: 1 };
//     let mass = 2;

//     let block = new THREE.Mesh(new THREE.BoxGeometry(scale.x, scale.y, scale.z), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
//     block.position.set(pos.x, pos.y, pos.z);
//     block.castShadow = true;
//     block.receiveShadow = true;
//     block.userData.draggable = true;
//     block.userData.tag = "BLOCK";
//     scene.add(block);
//     draggableObjects.push(block);

//     let transform = new Ammo.btTransform();
//     transform.setIdentity();
//     transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
//     transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
//     let motionState = new Ammo.btDefaultMotionState(transform);

//     let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
//     colShape.setMargin(0.05);

//     let localInertia = new Ammo.btVector3(0, 0, 0);
//     colShape.calculateLocalInertia(mass, localInertia);

//     let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
//     let body = new Ammo.btRigidBody(rbInfo);
//     body.setFriction(4);
//     body.setRollingFriction(10);
//     physicsWorld.addRigidBody(body);
//     rigidBodies.push({ threeObject: block, ammoBody: body });

//     block.userData.physicsBody = body;
//     body.threeObject = block;
// }

class RigidBody {
    constructor(physicsWorld, draggableObjects, rigidBodies, scene, params) {
        this.physicsWorld = physicsWorld;
        this.draggableObjects = draggableObjects;
        this.rigidBodies = rigidBodies;
        this.scene = scene;
        this.params = params;

        this.object = null;
        this.physicsBody = null;
    }

    create() {
        throw new Error('Method "create()" must be implemented');
    }

    updatePhysicsBody() {
        throw new Error('Method "updatePhysicsBody()" must be implemented');
    }
}

class Ball extends RigidBody {
    constructor(physicsWorld, draggableObjects, rigidBodies, scene, params) {
        super(physicsWorld, draggableObjects, rigidBodies, scene, params);
    }

    create() {
        const { x, y, z, radius, color } = this.params;
        const mass = 1;
        const quat = { x: 0, y: 0, z: 0, w: 1 };

        this.object = new THREE.Mesh(new THREE.SphereGeometry(radius), new THREE.MeshPhongMaterial({ color }));
        this.object.position.set(x, y, z);
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.object.userData.draggable = true;
        this.object.userData.tag = "BALL";
        this.scene.add(this.object);
        this.draggableObjects.push(this.object);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        const motionState = new Ammo.btDefaultMotionState(transform);

        const colShape = new Ammo.btSphereShape(radius);
        colShape.setMargin(0.05);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        this.physicsBody = new Ammo.btRigidBody(rbInfo);
        this.physicsBody.setFriction(4);
        this.physicsBody.setRollingFriction(10);
        this.physicsWorld.addRigidBody(this.physicsBody);
        this.rigidBodies.push({ threeObject: this.object, ammoBody: this.physicsBody });

        this.object.userData.physicsBody = this.physicsBody;
        this.physicsBody.threeObject = this.object;
    }

    updatePhysicsBody(radius) {
        const shape = new Ammo.btSphereShape(radius);
        shape.setMargin(0.05);
        this.physicsBody.setCollisionShape(shape);
        this.physicsBody.activate();
    }
}

class Block extends RigidBody {
    constructor(physicsWorld, draggableObjects, rigidBodies, scene, params) {
        super(physicsWorld, draggableObjects, rigidBodies, scene, params);
    }

    create() {
        const { x, y, z, width, height, depth, color } = this.params;
        const mass = 2;
        const quat = { x: 0, y: 0, z: 0, w: 1 };

        this.object = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshPhongMaterial({ color }));
        this.object.position.set(x, y, z);
        this.object.castShadow = true;
        this.object.receiveShadow = true;
        this.object.userData.draggable = true;
        this.object.userData.tag = "BLOCK";
        this.scene.add(this.object);
        this.draggableObjects.push(this.object);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y, z));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        const motionState = new Ammo.btDefaultMotionState(transform);

        const colShape = new Ammo.btBoxShape(new Ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5));
        colShape.setMargin(0.05);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        this.physicsBody = new Ammo.btRigidBody(rbInfo);
        this.physicsBody.setFriction(4);
        this.physicsBody.setRollingFriction(10);
        this.physicsWorld.addRigidBody(this.physicsBody);
        this.rigidBodies.push({ threeObject: this.object, ammoBody: this.physicsBody });

        this.object.userData.physicsBody = this.physicsBody;
        this.physicsBody.threeObject = this.object;
    }

    updatePhysicsBody(width, height, depth) {
        const shape = new Ammo.btBoxShape(new Ammo.btVector3(width * 0.5, height * 0.5, depth * 0.5));
        shape.setMargin(0.05);
        this.physicsBody.setCollisionShape(shape);
        this.physicsBody.activate();
    }
}

export { Ball, Block };