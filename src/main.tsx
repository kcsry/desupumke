import "./index.css";
import * as Phaser from "phaser";
import desukun1 from "./img/desukun1.png";
import desukun2 from "./img/desukun2.png";
import grass from "./img/grass1.png";
import puff from "./img/puff.png";
import leaf1 from "./img/leaf.png";
import leaf2 from "./img/leaf2.png";
import leaf3 from "./img/leaf3.png";
import leaf4 from "./img/leaf4.png";
import birb from "./mus/birb.mp3";
import bad from "./mus/bad.mp3";
import tada from "./mus/tada.mp3";
import music from "./mus/win.mp3";
import pr3 from "./mus/pr3.mp3";
import desumask from "./desumask";
import gothicImg from "./img/gothic_0.png";
import gothicCfg from "./img/gothic.xml?url";

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

class GameScene extends Phaser.Scene {
  private desukun: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = null as any;
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager = null as any;
  private leaves: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter = null as any;
  private scoreText: Phaser.GameObjects.BitmapText = null as any;
  private rankText: Phaser.GameObjects.BitmapText = null as any;
  private helpText: Phaser.GameObjects.BitmapText = null as any;
  private birbs: Phaser.Sound.WebAudioSound = null as any;
  private motor: Phaser.Sound.WebAudioSound = null as any;
  private timer: Phaser.Time.TimerEvent = null as any;
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
    this.load.image("leaf1", leaf1);
    this.load.image("leaf2", leaf2);
    this.load.image("leaf3", leaf3);
    this.load.image("leaf4", leaf4);
    this.load.audio("birb", birb);
    this.load.audio("motor", pr3);
    this.load.audio("bad", bad);
    this.load.audio("tada", tada);
    this.load.audio("music", music);

    this.load.bitmapFont("gothic", gothicImg, gothicCfg);
  }

  create(): void {
    this.score = 0;
    this.timeElapsed = 0;
    this.leaves = [];
    this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, "grass");

    const scale = 260;
    const leafSpriteNames = ["leaf1", "leaf2", "leaf3", "leaf4"];
    for (let i = 0; i < 750; i++) {
      const [fx, fy] = choice(desumask);
      const x = 160 + fx * scale + Math.random() * 3;
      const y = 15 + fy * scale + Math.random() * 3;
      const spr = this.physics.add.sprite(x, y, choice(leafSpriteNames));
      spr.flipX = Math.random() < 0.5;
      spr.flipY = Math.random() < 0.5;
      spr.body.setDrag(rand(100, 150), rand(100, 150));
      spr.body.setAngularDrag(500);
      // spr.body.setFriction(0.3, 0.3);
      this.leaves.push(spr);
    }

    this.desukun = this.physics.add.sprite(55, 55, "desukun1");

    this.particles = this.add.particles("puff");

    this.emitter = this.particles.createEmitter({
      speed: 60,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.3, end: 0 },
      blendMode: "ADD",
      on: false,
      frequency: 70,
    });

    this.emitter.startFollow(this.desukun);

    this.scoreText = this.add.bitmapText(5, 5, "gothic", "hello");
    this.scoreText.blendMode = "ADD";

    this.rankText = this.add.bitmapText(WIDTH / 2, HEIGHT / 2, "gothic", "");
    this.rankText.setOrigin(0.5, 0.5);
    this.rankText.setScale(3, 3);
    this.rankText.setCenterAlign();
    this.rankText.blendMode = "ADD";

    this.helpText = this.add.bitmapText(
      WIDTH / 2,
      HEIGHT / 2,
      "gothic",
      "HELP DESU-KUN CLEAN UP LAWN!!\nUSE YOUR MOUSE !\nGOOD SCORE = EXTRA PRIZE ..."
    );
    this.helpText.setOrigin(0.5, 0.5);
    this.helpText.setScale(2, 2);
    this.helpText.blendMode = "ADD";

    this.birbs = this.sound.add("birb") as Phaser.Sound.WebAudioSound;
    this.birbs.addMarker(LOOP_CONFIG);
    this.birbs.play("loop");
    this.motor = this.sound.add("motor") as Phaser.Sound.WebAudioSound;
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
            music = this.sound.add("music") as Phaser.Sound.WebAudioSound;
            music.play();
          },
        });
      }
      const retry = this.add.bitmapText(
        WIDTH / 2,
        HEIGHT * 0.8,
        "gothic",
        "[ RETRY! ]"
      );
      retry.setOrigin(0.5, 0.5);
      retry.setScale(2, 2);
      retry.blendMode = "ADD";
      retry.setInteractive();
      retry.on("pointerdown", () => {
        this.birbs.destroy();
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
      this.physics.moveToObject(desukun, ptr, 180);
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
        l.body.angularVelocity += 15 * Math.cos(angle);
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
