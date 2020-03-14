import Phaser from "phaser";
import rocketImg from './assets/asteroids_rocket.png';
import asteroidSImg from './assets/asteroids_asteroid_small.png';
import bulletImg from './assets/asteroids_bullet.png';

const WIDTH = 800;
const HEIGHT = 600;

/**
 * # Asteroids
 * - Fly around
 * - destroy asteroids
 * - if they touch you, your rocketship is destroyed
 * - you have 3 rocketships
 * - a large sized asteroid lands you 20 credits
 * - a medium sized asteroid gets you 50 credits
 * - a small sized asteroid gets you 100 credits
 * Points:
 *  20pts - Large Asteroid
 *  50pts - Medium Asteroid
 * 100pts - Small Asteroid
 */

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y, shooter) {
    super(scene, x, y, 'bullet');
  }

  fire (shooter) {
    this.body.reset(shooter.x, shooter.y);
    this.setRotation(shooter.rotation);
    let velocityVector = this.scene.physics.velocityFromRotation(shooter.rotation, 300);
    this.setVelocity(velocityVector.x, velocityVector.y);
  }

  preUpdate (time, delta) {
    super.preUpdate(time, delta);
    const inBounds = Phaser.Geom.Rectangle.Overlaps(this.scene.physics.world.bounds, this.getBounds());
    if (!inBounds) {
      this.destroy();
    }
  }
}

class Bullets extends Phaser.Physics.Arcade.Group {
  constructor (scene) {
    super(scene.physics.world, scene)
    this.classType = Bullet;
    this.maxSize = 10;
  }

  fireBullet (shooter) {
    let bullet = this.create(shooter.x, shooter.y);
    if (bullet) {
      bullet.fire(shooter);
    }
  }

}

class Asteroid extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y, size) {
    switch (size) {
      case 'small':
      default:
        super (scene, x, y, 'asteroid_small');
        this.size = 'small';
        this.credits = 100;
        this.asteroidVelocity = Phaser.Math.RND.between(50, 200);
    }
    scene.add.existing(this);
    scene.physics.add.existing(this);
    console.log('Asteroid created', x, y);
    this.move();
  }
  
  move() {
    const rotation = Phaser.Math.RND.between(0, 359);
    const velocity = this.asteroidVelocity
    this.setRotation(rotation);
    let velocityVector = this.scene.physics.velocityFromRotation(rotation, velocity);
    this.setVelocity(velocityVector.x, velocityVector.y);
  }

  getCredits() {
    return this.credits;
  }
}

class Asteroids extends Phaser.Physics.Arcade.Group {
  constructor (scene) {
    super(scene.physics.world, scene);
    this.classType = Asteroid;
    this.maxSize = 14;

    this.initializeAsteroids()
  }

  initializeAsteroids() {
    for (let asteroidCnt = 0; asteroidCnt < this.maxSize; asteroidCnt++) {
      const x = Phaser.Math.RND.between(0, HEIGHT);
      const y = Phaser.Math.RND.between(0, WIDTH);
      const asteroid = this.create(x, y);
      asteroid.move();
    }
  }
}

class AsteroidsGame extends Phaser.Scene {
  constructor() {
    super({ key: 'AsteroidsGame' });
    this.up;
    this.left;
    this.right;
    this.down;
    this.shoot;

    this.rocket;
    this.bullets;
    this.lastShot;

    this.rockets = 3;
    this.score = 0;
    this.scoreText;
  }
  preload() {
    this.load.image('rocket', rocketImg, { frameWidth: 16, frameHeight: 16 });
    this.load.image('asteroid_small', asteroidSImg, { frameWidth: 16, frameHeight: 16 });
    this.load.image('bullet', bulletImg, { frameWidth: 2, frameHeight: 2 })
  }

  create() {
    this.score = this.game.registry.get('score') || 0;
    this.game.registry.set('score', this.score);

    this.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.shoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    this.rocket = this.physics.add.sprite(WIDTH/2, HEIGHT/2, 'rocket');
    this.rocket.angle = -90;
    this.rocket.setMaxVelocity(200);
    this.rocket.setDrag(0.99);
    this.rocket.setDamping(true);
    
    this.bullets = new Bullets(this);
    this.asteroids = new Asteroids(this);
    this.rocketHit = false;

    this.scoreText = this.add.text(10, 10, this.score, { font: '16px Courier', fill: '#00ffff' })
  }
  
  update() {
    if (this.up.isDown) {
      this.physics.velocityFromRotation(this.rocket.rotation, 200, this.rocket.body.acceleration);
    } else if (this.down.isDown) {
      this.physics.velocityFromRotation(this.rocket.rotation, -200, this.rocket.body.acceleration);
    } else {
      this.rocket.setAcceleration(0);
    }
  
    if (this.left.isDown) {
      this.rocket.setAngularVelocity(-300);
    }
    else if (this.right.isDown) {
      this.rocket.setAngularVelocity(300);
    }
    else {
      this.rocket.setAngularVelocity(0);
    }

    if (this.shoot.isDown && (this.lastShot !== this.shoot.timeDown)) {
      this.bullets.fireBullet(this.rocket);
      this.lastShot = this.shoot.timeDown;
    }
  
    this.physics.add.collider(this.bullets, this.asteroids, this.bulletCollidedWithAsteroid, null, this);
    if (!this.rocketHit) {
      this.rocketHit = true;
      this.physics.add.collider(this.asteroids, this.rocket, this.asteroidCollideWithRocket, null, this);
    }

    this.scoreText.setText(this.score);
    
    this.physics.world.wrap(this.rocket, 16);
    this.physics.world.wrap(this.asteroids, 16);
  }
  
  bulletCollidedWithAsteroid(bullet, asteroid) {
    bullet.destroy();
    this.addCredits(asteroid.getCredits());
    console.log('Got Credits', asteroid.getCredits(), this.score);
    asteroid.destroy();
  }
  
  asteroidCollideWithRocket(rocket, asteroid) {
    this.scene.start('AsteroidsScoreboard');
  }
  
  addCredits(credits) {
    this.score += credits;
    this.registry.set('score', this.score);
  }

}

class AsteroidsScoreboard extends Phaser.Scene {
  constructor() {
    super({ key: 'AsteroidsScoreboard' });
  }
  
  create() {
    const { score } = this.registry.getAll();
    console.log('REGISTRY', score);
    const text = this.add.text(WIDTH/2, HEIGHT * 0.4, 'SCORE', { font: '36px Courier', fill: '#ff00ff' });
    text.setOrigin(0.5, 0.5);
    
    this.score = this.add.text(WIDTH/2, HEIGHT * 0.5, score, { font: '52px Courier', fill: '#00ffff' });
    this.score.setOrigin(0.5, 0.5);
    
    const retry = this.add.text(WIDTH/2, HEIGHT * 0.75, 'CLICK TO TRY AGAIN', { font: '24px Courier', fill: '#ff00ff' });
    retry.setOrigin(0.5, 0.5);
    
    
    this.input.on('pointerdown', (pointer) => {
      this.registry.set('score', 0);
      this.scene.start('AsteroidsGame');
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: WIDTH,
  height: HEIGHT,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      fps: 60,
      gravity: {
        y: 0
      }
    }
  },
  scene: [AsteroidsGame, AsteroidsScoreboard]
};

const game = new Phaser.Game(config);
