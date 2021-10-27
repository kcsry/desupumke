import "./index.css";
import * as Phaser from "phaser";
import desukun1 from "./img/desukun1.png";
import desukun2 from "./img/desukun2.png";
import grass from "./img/grass1.png";
import puff from "./img/bloodecchi.png";
import damnedSouls from "./mus/DESUNE_DAMNEDSOULS_v666.mp3";
import bad from "./mus/bad.mp3";
import tada from "./mus/tada.mp3";
import winMusic from "./mus/desWEENwin_6.mp3";
import motor from "./mus/ch2.mp3";
import desumask from "./desumask";
import gothicImg from "./img/gothic_0.png";
import gothicCfg from "./img/gothic.xml?url";
import ghoulImg from "./img/ghoul_0.png";
import ghoulCfg from "./img/ghoul.xml?url";

const pumkes = import.meta.globEager("./img/pumke*.png");

const WIDTH = 580;
const HEIGHT = 400;
const MAX_BLOW_DIST = 50;
const MAX_BLOW_DIST_SQR = MAX_BLOW_DIST * MAX_BLOW_DIST;
const FORCE_MUL = 50;
const VEL_MUL = 0.55;
const TOTAL_TIME = 100;
const GOOD_SCORE = 66;

function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}

const LOOP_CONFIG = {
  name: "loop",
  start: 0,
  config: {
    loop: true,
  },
};

function getRank(score: number): string {
  if (score <= 1) return "BAD :(";
  if (score >= 98) return "SUPER STAR";
  if (Math.floor(score) === 69) return "NICE ;)";
  const rankMaj = Math.max(0, Math.min(9, Math.floor(9 - score / 10)));
  const rankMin = score % 10;
  const letter = "SABCDFGQXÖ"[rankMaj];
  const plus = rankMin > 8 ? "+" : rankMin < 3 ? "-" : "";
  return letter + plus;
}

const CHOIR_SOUND = "birb";

const MOTOR_SOUND = "motor";

const WIN_MUSIC = "music";

const DESUKUN_SPEED = 220;

class GameScene extends Phaser.Scene {
  private desukun: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = null as any;
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager = null as any;
  private leaves: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter = null as any;
  private scoreText: Phaser.GameObjects.BitmapText = null as any;
  private rankText: Phaser.GameObjects.BitmapText = null as any;
  private helpText: Phaser.GameObjects.BitmapText = null as any;
  private choirOfDamned: Phaser.Sound.WebAudioSound = null as any;
  private motor: Phaser.Sound.WebAudioSound = null as any;
  private timer: Phaser.Time.TimerEvent = null as any;
  private readonly pumkeSpriteNames: string[] = [];
  private score = 0;
  private timeElapsed = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  preload(): void {
    this.load.image("desukun1", desukun1);
    this.load.image("desukun2", desukun2);
    this.load.image("grass", grass);
    this.load.image("puff", puff);
    Object.entries(pumkes).forEach(([name, urlModule]) => {
      this.load.image(name, urlModule.default);
      this.pumkeSpriteNames.push(name);
    });
    this.load.audio(CHOIR_SOUND, damnedSouls);
    this.load.audio(MOTOR_SOUND, motor);
    this.load.audio("bad", bad);
    this.load.audio("tada", tada);
    this.load.audio(WIN_MUSIC, winMusic);

    this.load.bitmapFont("gothic", gothicImg, gothicCfg);
    this.load.bitmapFont("ghoul", ghoulImg, ghoulCfg);
  }

  create(): void {
    this.score = 0;
    this.timeElapsed = 0;
    this.leaves = [];
    this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, "grass");

    const scale = 280;
    for (let i = 0; i < 300; i++) {
      const [fx, fy] = choice(desumask);
      const x = Math.floor(160 + fx * scale + Math.random() * 3);
      const y = Math.floor(15 + fy * scale + Math.random() * 3);
      const spr = this.physics.add.sprite(x, y, choice(this.pumkeSpriteNames));
      spr.flipX = Math.random() < 0.5;
      // spr.flipY = Math.random() < 0.5;
      spr.body.setDrag(rand(100, 150), rand(100, 150));
      spr.body.setAngularDrag(500);
      // spr.body.setFriction(0.3, 0.3);
      this.leaves.push(spr);
    }

    this.desukun = this.physics.add.sprite(
      WIDTH / 2 + ((rand(0.8, 0.9) * WIDTH) / 2) * (rand(0, 1) < 0.5 ? -1 : 1),
      rand(55, 300),
      "desukun1"
    );

    this.particles = this.add.particles("puff");

    this.emitter = this.particles.createEmitter({
      speed: 60,
      scale: { start: 3, end: 1 },
      alpha: 0.9,
      on: false,
      frequency: 70,
      gravityY: 1000,
      accelerationY: -150,
      accelerationX: { min: -150, max: 150 },
      lifespan: 750,
    });

    this.emitter.startFollow(this.desukun);

    this.scoreText = this.add.bitmapText(5, 5, "gothic", "hello");
    this.scoreText.blendMode = "ADD";

    this.rankText = this.add.bitmapText(WIDTH / 2, HEIGHT / 3, "ghoul", "");
    this.rankText.setOrigin(0.5, 0.5);
    this.rankText.setScale(3, 3);
    this.rankText.setCenterAlign();

    this.helpText = this.add.bitmapText(
      WIDTH / 2,
      HEIGHT / 2,
      "ghoul",
      [
        "KONNICHIWASSUP ! ! !",
        "EVIL PUMPKINS ARE INVADING",
        "MURDER-DESU-KUN'S HOME ! !",
        "HELP YEET THEM WITH MOUSE !",
        "GOOD SCORE = EXTRA PRIZE ;-)",
      ].join("\n")
    );
    this.helpText.setOrigin(0.5, 0.5);
    this.helpText.setScale(1.5, 1.5);
    this.helpText.align = 1;
    this.helpText.letterSpacing = 2;
    // this.helpText.blendMode = "ADD";

    this.choirOfDamned = this.sound.add(
      CHOIR_SOUND
    ) as Phaser.Sound.WebAudioSound;
    this.choirOfDamned.addMarker(LOOP_CONFIG);
    this.choirOfDamned.play("loop");
    this.motor = this.sound.add(MOTOR_SOUND) as Phaser.Sound.WebAudioSound;
    this.motor.addMarker(LOOP_CONFIG);
    this.motor.setVolume(0);

    this.timer = this.time.addEvent({
      delay: 100,
      loop: true,
      paused: true,
      callback: this.timerCallback,
    });
  }

  private timerCallback = () => {
    this.timeElapsed++;
    if (Math.floor(this.timeElapsed) === TOTAL_TIME + 10) {
      this.sound.add(this.score >= GOOD_SCORE ? "tada" : "bad").play();
      const admo =
        this.score >= GOOD_SCORE ? "GOOD JOB !!!" : "YOU CAN DO BETTER";
      this.rankText.setText(`RANK ${getRank(this.score)}\n${admo}`);
      let music: Phaser.Sound.WebAudioSound | undefined = undefined;
      if (this.score >= GOOD_SCORE) {
        this.time.addEvent({
          delay: 1500,
          callback: () => {
            music = this.sound.add(WIN_MUSIC) as Phaser.Sound.WebAudioSound;
            music.play();
          },
        });
      }
      const retry = this.add.bitmapText(
        WIDTH / 2,
        HEIGHT * 0.8,
        "ghoul",
        "[ RETRY! ]"
      );
      retry.setOrigin(0.5, 0.5);
      retry.setScale(2, 2);
      retry.setInteractive();
      retry.on("pointerdown", () => {
        this.choirOfDamned.destroy();
        if (music) music.destroy();
        this.scene.restart();
      });
    }
  };

  update(time: number, delta: number): void {
    this.score = this.computeScore();
    const timeRemaining = Math.max(0, TOTAL_TIME - this.timeElapsed);
    this.scoreText.setText(`Score: ${this.score}% - Time: ${timeRemaining}`);
    this.regularGameplay(timeRemaining, delta);
  }

  private computeScore() {
    const rawScore =
      this.leaves.reduce((sc, l) => {
        if (l.x < 0 || l.x > WIDTH || l.y < 0 || l.y > HEIGHT) {
          return sc + 1;
        }
        return sc;
      }, 0) / this.leaves.length;
    return Math.round(rawScore * 100);
  }

  private regularGameplay(timeRemaining: number, delta: number): void {
    const desukun = this.desukun;
    const ptr = this.input.activePointer;
    let blows = 0;
    desukun.setTexture(
      desukun.body.velocity.length() > 5
        ? ["desukun1", "desukun2"][Math.floor(this.game.getTime() / 100) % 2]
        : "desukun1"
    );
    if (this.timeElapsed >= TOTAL_TIME + 25 && this.score >= GOOD_SCORE) {
      // DANCE FOR ME
      desukun.flipX = Math.floor(this.timeElapsed / 2) % 2 == 0;
    }
    if (
      ptr.isDown &&
      Phaser.Math.Distance.BetweenPointsSquared(desukun, ptr) > 45 &&
      timeRemaining > 0
    ) {
      if (Math.abs(desukun.body.velocity.x) > 1) {
        desukun.flipX = desukun.body.velocity.x > 0;
      }
      this.emitter.followOffset.set(-60 * (desukun.flipX ? -1 : 1), 0);
      this.physics.moveToObject(desukun, ptr, DESUKUN_SPEED);
      this.leaves.forEach((l) => {
        const rawDistanceSqr = Phaser.Math.Distance.BetweenPointsSquared(
          desukun,
          l
        );
        if (rawDistanceSqr > MAX_BLOW_DIST_SQR) return;
        const power = Math.sqrt(rawDistanceSqr) / MAX_BLOW_DIST;
        if (power < 0.5) return;
        const angle = Math.atan2(l.y - desukun.y, l.x - desukun.x);

        const x =
          Math.cos(angle) * FORCE_MUL * power +
          desukun.body.velocity.x * VEL_MUL;
        const y =
          Math.sin(angle) * FORCE_MUL * power +
          desukun.body.velocity.y * VEL_MUL;

        const blowForceMul = 0.11 * (delta / 7);
        l.body.velocity.add({
          x: x * rand(0.2, 0.5) * blowForceMul,
          y: y * rand(0.2, 0.5) * blowForceMul,
        });
        l.body.angularVelocity += 35 * Math.cos(angle);
        blows++;
      });
    } else {
      const vel = desukun.body.velocity.scale(0.9);
      desukun.setVelocity(vel.x, vel.y);
    }

    this.emitter.on = blows > 10;
    if (blows > 5) {
      this.helpText.setVisible(false);
      if (!this.motor.isPlaying) {
        this.motor.play("loop");
      }
      this.motor.setVolume(1);
      this.timer.paused = false;
    } else {
      this.motor.setVolume(this.motor.volume * 0.95);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  width: WIDTH,
  height: HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
  },
  physics: {
    default: "arcade",
    arcade: {
      fps: 60,
      // debug: true,
    },
  },
  scene: [GameScene],
};

window.addEventListener("load", () => {
  const game = new Phaser.Game(config);
});
