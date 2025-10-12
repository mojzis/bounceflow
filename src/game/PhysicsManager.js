/**
 * PhysicsManager - Manages Matter.js physics engine and collision detection
 *
 * Responsibilities:
 * - Initialize and configure Matter.js engine and world
 * - Create and manage boundary walls
 * - Handle physics simulation updates with fixed timestep
 * - Manage collision detection callbacks
 * - Handle canvas resize events
 *
 * Public API:
 * - constructor(canvas): Initialize physics with canvas dimensions
 * - update(deltaTime): Update physics simulation (fixed 60Hz timestep)
 * - onCollision(callback): Register collision event callback
 * - resize(width, height): Recreate walls for new canvas dimensions
 *
 * Properties:
 * - engine: Matter.js Engine instance
 * - world: Matter.js World instance
 * - walls: Array of boundary wall bodies
 */
import * as Matter from 'matter-js';

export class PhysicsManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.setupPhysics();
        this.collisionCallbacks = [];
    }

    setupPhysics() {
        // Create Matter.js engine
        this.engine = Matter.Engine.create({
            enableSleeping: false,
            positionIterations: 10,
            velocityIterations: 10
        });
        this.world = this.engine.world;

        // Configure gravity (scale for better gameplay)
        this.world.gravity.y = 0.5;

        // Disable air resistance
        this.world.gravity.scale = 0.001;

        // Create walls
        const wallOptions = { isStatic: true, friction: 0, restitution: 0.99 };
        this.walls = [
            Matter.Bodies.rectangle(this.canvas.width / 2, -25, this.canvas.width, 50, wallOptions), // Top
            Matter.Bodies.rectangle(this.canvas.width / 2, this.canvas.height + 25, this.canvas.width, 50, wallOptions), // Bottom
            Matter.Bodies.rectangle(-25, this.canvas.height / 2, 50, this.canvas.height, wallOptions), // Left
            Matter.Bodies.rectangle(this.canvas.width + 25, this.canvas.height / 2, 50, this.canvas.height, wallOptions) // Right
        ];

        Matter.World.add(this.world, this.walls);

        // Set up collision detection
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            this.collisionCallbacks.forEach(callback => callback(event.pairs));
        });
    }

    update(deltaTime) {
        // Update physics with fixed timestep (16.67ms = 60Hz)
        const fixedTimeStep = 1000 / 60;
        Matter.Engine.update(this.engine, fixedTimeStep);
    }

    onCollision(callback) {
        this.collisionCallbacks.push(callback);
    }

    resize(width, height) {
        // Recreate walls with new dimensions
        Matter.World.remove(this.world, this.walls);
        const wallOptions = { isStatic: true, friction: 0, restitution: 0.99 };
        this.walls = [
            Matter.Bodies.rectangle(width / 2, -25, width, 50, wallOptions),
            Matter.Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions),
            Matter.Bodies.rectangle(-25, height / 2, 50, height, wallOptions),
            Matter.Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions)
        ];
        Matter.World.add(this.world, this.walls);
    }
}
