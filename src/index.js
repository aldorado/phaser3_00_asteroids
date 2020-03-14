import Phaser from "phaser";
import rocketImg from './assets/asteroids_rocket.png';
import asteroidSImg from './assets/asteroids_asteroid_small.png';
import bulletImg from './assets/asteroids_bullet.png';

class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor (scene, x, y) {
    super(scene, x, y, 'bullet');
  }

  fire (shooter) {
    this.body.reset(shooter.x, shooter.y);
    this.setActive(true);
    this.setVisible(true);
    this.setRotation(shooter.rotation);
    let velocityVector = this.scene.physics.velocityFromRotation(shooter.rotation, 300);
    this.setVelocity(velocityVector.x, velocityVector.y);
  }

  preUpdate (time, delta) {
    super.preUpdate(time, delta);
    const inBounds = Phaser.Geom.Rectangle.Overlaps(this.scene.physics.world.bounds, this.getBounds());
    if (!inBounds) {
      this.setActive(false);
      this.setVisible(false);
    }
  }
}

class Bullets extends Phaser.Physics.Arcade.Group {
  constructor (scene) {
    super(scene.physics.world, scene);

    this.createMultiple({
      frameQuantity: 10,
      key: 'bullet',
      active: false,
      visible: false,
      classType: Bullet
    });
  }

  fireBullet (shooter) {
    let bullet = this.getFirstDead(false);
    if (bullet) {
      bullet.fire(shooter);
    }
  }

}

class Asteroids extends Phaser.Scene {
  constructor() {
    super();
    this.up;
    this.left;
    this.right;
    this.down;
    this.shoot;

    this.rocket;
    this.bullets;
    this.lastShot;
  }
  preload() {
    this.load.image('rocket', rocketImg, { frameWidth: 16, frameHeight: 16 });
    this.load.image('asteroid_small', asteroidSImg);
    this.load.image('bullet', bulletImg)
  }

  create() {
    this.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.shoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    this.rocket = this.physics.add.sprite(400, 300, 'rocket');
    this.rocket.angle = -90;
    this.rocket.setMaxVelocity(200);
    this.rocket.setDrag(0.99);
    this.rocket.setDamping(true);

    this.bullets = new Bullets(this);
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
  
    this.physics.world.wrap(this.rocket, 16);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: {
        y: 0
      }
    }
  },
  scene: Asteroids
};

const game = new Phaser.Game(config);
