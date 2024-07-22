import * as THREE from 'three';
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