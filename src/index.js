import Phaser from "phaser";
import rocketImg from './assets/asteroids_rocket.png';
import asteroidSImg from './assets/asteroids_asteroid_small.png';
import asteroidMImg from './assets/asteroids_asteroid_medium.png';
import asteroidLImg from './assets/asteroids_asteroid_large.png';
import bulletImg from './assets/asteroids_bullet.png';
import starsBg from './assets/asteroids_stars_tiles_big.png';
import sibwaxLogoAnim from './assets/sibwax_logo_animation.png';

import { WIDTH, HEIGHT } from './config';

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
 * 
 * 
 * Ok, I had a liiiittle sideways idea, 
 * now the game gets exponential harder if all asteroids are destroyed
 * 
 * I'm going stop here, I learned the phaser 3 basics
 * thats what I wanted to learn, see you at the next game
 */


// ######### SPRITES #############

class Rocket extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, controls, bullets) {
    super(scene, x, y, 'rocket');
    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    this.bullets = bullets;
    
    this.up = controls.up;
    this.left = controls.left;
    this.right = controls.right;
    this.down = controls.down;
    this.shoot = controls.shoot;
    
    this.angle = -90;
    this.setDrag(0.99);
    this.setDamping(true);
    this.setMaxVelocity(200);

    this.scene.anims.create({
      key: 'thrust',
      frameRate: 12,
      repeat: 0,
      frames: this.scene.anims.generateFrameNumbers('rocket', {
        frames: [0,1,2]
      })
    });

  }
  
  update() {
    if (this.up.isDown) {
      this.scene.physics.velocityFromRotation(this.rotation, 200, this.body.acceleration);
      this.play('thrust');
    } else if (this.down.isDown) {
      this.scene.physics.velocityFromRotation(this.rotation, -200, this.body.acceleration);
      this.play('thrust');
    } else {
      this.setAcceleration(0);
    }
  
    if (this.left.isDown) {
      this.setAngularVelocity(-300);
    }
    else if (this.right.isDown) {
      this.setAngularVelocity(300);
    }
    else {
      this.setAngularVelocity(0);
    }

    if (this.shoot.isDown && (this.lastShot !== this.shoot.timeDown)) {
      this.bullets.fireBullet(this);
      this.lastShot = this.shoot.timeDown;
    }
  }

}

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y) {
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

class Asteroid extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y, size) {
    switch (size) {
      case 'large':
        super (scene, x, y, 'asteroid_large');
        this.credits = 20;
        this.size = size;
        break;
      case 'medium':
        super (scene, x, y, 'asteroid_medium');
        this.credits = 50;
        this.size = size;
        break;
      case 'small':
      default:
        super (scene, x, y, 'asteroid_small');
        this.size = 'small';
        this.credits = 100;
    }
    scene.add.existing(this);
    scene.physics.add.existing(this);
    console.log('Asteroid created', x, y);
  }
  
  initialize() {
    const rotation = Phaser.Math.RND.between(0, 359);
    const velocity = Phaser.Math.RND.between(50, 200);
    this.setRotation(rotation);
    let velocityVector = this.scene.physics.velocityFromRotation(rotation, velocity);
    this.setVelocity(velocityVector.x, velocityVector.y);
  }

  getCredits() {
    return this.credits;
  }
}

// ######### GROUPS #############

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

class Asteroids extends Phaser.Physics.Arcade.Group {
  constructor (scene) {
    super(scene.physics.world, scene);
    this.scene = scene;
    this.classType = Asteroid;
    this.baseSize = 4;

    this.initializeAsteroids()
  }

  initializeAsteroids() {
    for (let asteroidCnt = 0; asteroidCnt < this.baseSize; asteroidCnt++) {
      const x = Phaser.Math.RND.between(0, HEIGHT);
      const y = Phaser.Math.RND.between(0, WIDTH);
      const asteroid = new Asteroid(this.scene, x, y, 'large')
      this.add(asteroid);
      asteroid.initialize();
    }
  }
  
  createFragments(size, x, y) {
    let newSize;
    switch (size) {
      case 'large':
        newSize = 'medium';
        break;
      case 'medium':
        newSize = 'small';
        break;
    }

    console.log('[createFragments]', {size, x, y, newSize});
    if (newSize) {
      for (let asteroidCnt = 0; asteroidCnt < this.baseSize; asteroidCnt++) {
        const asteroid = new Asteroid(this.scene, x, y, newSize)
        this.add(asteroid);
        asteroid.initialize();
      }
    }
  }

  checkAsteroids() {
    if (this.children.size === 0) {
      this.initializeAsteroids();
    }
  }

}

// ######### SCENES #############

class SibwaxSplash extends Phaser.Scene {
  constructor() {
    super({ key: 'SibwaxSplash' });
  }

  preload() {
    this.load.spritesheet('logo', sibwaxLogoAnim, {
      frameHeight: 45,
      frameWidth: 325
    });
  }

  create() {
    let logoSprite = this.add.sprite(WIDTH/2, HEIGHT/2, 'logo');
    this.anims.create({
      key: 'logo_animation',
      frameRate: 12,
      repeat: 0,
      frames: this.anims.generateFrameNumbers('logo', {
        frames: [0,0,0,0,0,0,0,1,2,3,4,5,6,7,0]
      })
    });

    logoSprite.play('logo_animation');

    this.input.on('pointerup', () => {
      this.scene.start('AsteroidsGame');
    })
  }
}

class AsteroidsGame extends Phaser.Scene {
  constructor() {
    super({ key: 'AsteroidsGame' });

    this.bg;

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
    this.load.image('background_stars', starsBg);
    this.load.spritesheet('rocket', rocketImg, { frameWidth: 16, frameHeight: 16 });
    this.load.image('asteroid_small', asteroidSImg, { frameWidth: 16, frameHeight: 16 });
    this.load.image('asteroid_medium', asteroidMImg, { frameWidth: 32, frameHeight: 32 });
    this.load.image('asteroid_large', asteroidLImg, { frameWidth: 64, frameHeight: 64 });
    this.load.image('bullet', bulletImg, { frameWidth: 2, frameHeight: 2 })
  }

  create() {
    this.score = this.game.registry.get('score') || 0;
    this.game.registry.set('score', this.score);

    this.bg = this.add.tileSprite(WIDTH/2, HEIGHT/2, WIDTH, HEIGHT, 'background_stars');
    this.bg.alpha = 0.75;

    this.bullets = new Bullets(this);
    const controls = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }
    this.rocket = new Rocket(this, WIDTH/2, HEIGHT/2, controls, this.bullets)
    
    this.asteroids = new Asteroids(this);
    this.rocketHit = false;

    this.scoreText = this.add.text(10, 10, this.score, { font: '16px Courier', fill: '#00ffff' })
  }
  
  update() {

    this.rocket.update();
    
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
    console.log('Asteroid Size', asteroid.size);
    this.asteroids.createFragments(asteroid.size, asteroid.x, asteroid.y);
    asteroid.destroy();
    this.asteroids.checkAsteroids();
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

// ######### MAIN #############

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
  scene: [SibwaxSplash, AsteroidsGame, AsteroidsScoreboard]
};

const game = new Phaser.Game(config);
