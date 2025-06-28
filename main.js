class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.image('background', 'assets/images/background.jpg');
  }

  create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    this.add.text(200, 180, 'ASTEROID BLASTER', {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
    });

    const startButton = this.add.text(320, 300, 'START GAME', {
      fontSize: '32px',
      fill: '#00ff00',
      backgroundColor: '#000',
      padding: { x: 20, y: 10 },
    }).setInteractive();

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    this.add.text(270, 200, 'YOU WIN!', {
      fontSize: '48px',
      fill: '#00ff00',
      fontStyle: 'bold',
    });

    const menuButton = this.add.text(330, 300, 'MENU', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#222',
      padding: { x: 20, y: 5 }
    }).setInteractive();

    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    const playAgainButton = this.add.text(310, 350, 'PLAY AGAIN', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#444',
      padding: { x: 20, y: 5 }
    }).setInteractive();

    playAgainButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('player', 'assets/images/ship.png');
    this.load.image('missile', 'assets/images/projectile.png');
    this.load.image('rock1', 'assets/images/rock1.png');
    this.load.image('rock2', 'assets/images/rock2.png');
    this.load.image('background', 'assets/images/background.jpg');

    this.load.audio('background-music', 'assets/sounds/music.mp3');
    this.load.audio('shoot-sound', 'assets/sounds/missile-blast.mp3');
    this.load.audio('collision-sound', 'assets/sounds/pop.mp3');
  }

  create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);
    this.player = this.physics.add.sprite(400, 500, 'player').setScale(1).setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.projectiles = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    this.shootSound = this.sound.add('shoot-sound', {volume: 0.3});
    this.collisionSound = this.sound.add('collision-sound', { volume: 0.3 });
    this.backgroundMusic = this.sound.add('background-music', { loop: true, volume: 0.2 });
    this.backgroundMusic.play();

    this.score = 0;
    this.gameTime = 0;
    this.isGameOver = false;
    this.lastFired = 0;
    this.asteroidTextures = ['rock1', 'rock2'];

    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' });
    this.timeText = this.add.text(16, 44, 'Time: 0', { fontSize: '24px', fill: '#fff' });

    this.physics.add.overlap(this.projectiles, this.obstacles, this.handleProjectileCollision, null, this);
    this.physics.add.overlap(this.player, this.obstacles, this.handlePlayerCollision, null, this);

    this.time.addEvent({
      delay: 1200,
      callback: this.spawnAsteroid,
      callbackScope: this,
      loop: true,
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.space.isDown && time > this.lastFired + 300) {
      this.shootProjectile();
      this.lastFired = time;
    }

    this.projectiles.children.each(projectile => {
      if (projectile.y < -20) projectile.destroy();
    });

    this.obstacles.children.each(asteroid => {
      if (asteroid.y > 620) {
        asteroid.destroy();
        this.spawnAsteroid();
      }
    });

    this.gameTime += delta / 1000;
    this.timeText.setText('Time: ' + Math.floor(this.gameTime));

    // Win condition
    if (this.score >= 200) {
      this.backgroundMusic.stop();
      this.scene.start('WinScene');
    }
  }

  shootProjectile() {
    let laser = this.projectiles.create(this.player.x, this.player.y - 20, 'missile');
    laser.setVelocityY(-600);
    laser.setScale(0.03);
    laser.setAngle(-90);
    this.shootSound.play();
  }

  spawnAsteroid() {
    const x = Phaser.Math.Between(50, 750);
    const texture = Phaser.Utils.Array.GetRandom(this.asteroidTextures);
    const scale = Phaser.Math.FloatBetween(0.2, 0.3);

    let asteroid = this.obstacles.create(x, -50, texture);
    asteroid.setVelocityY(Phaser.Math.Between(150, 250));
    asteroid.setAngularVelocity(Phaser.Math.Between(-100, 100));
    asteroid.setScale(scale);

    const baseWidth = 20;
    const baseHeight = 40;
    const hitboxWidth = baseWidth * scale;
    const hitboxHeight = baseHeight * scale;

    asteroid.body.setSize(hitboxWidth, hitboxHeight);
    asteroid.body.setOffset(
      (asteroid.width * scale - hitboxWidth) / 2,
      (asteroid.height * scale - hitboxHeight) / 2
    );
  }

  handleProjectileCollision(laser, asteroid) {
    laser.destroy();
    asteroid.destroy();
    this.collisionSound.play();

    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }

  handlePlayerCollision(player, asteroid) {
    this.physics.pause();
    this.backgroundMusic.stop();
    this.collisionSound.play();
    this.isGameOver = true;

    this.add.text(260, 220, 'GAME OVER', { fontSize: '48px', fill: '#ff0000' });

    const retryButton = this.add.text(330, 300, 'RETRY', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#444',
      padding: { x: 15, y: 5 }
    }).setInteractive();

    retryButton.on('pointerdown', () => {
      this.scene.restart();
    });

    const menuButton = this.add.text(320, 350, 'MENU', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#222',
      padding: { x: 20, y: 5 }
    }).setInteractive();

    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [MenuScene, GameScene, WinScene]
};

new Phaser.Game(config);
