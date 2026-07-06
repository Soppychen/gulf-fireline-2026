import Phaser from 'phaser';
import { stage01 } from '../data/levels';
import { weapons } from '../data/weapons';
import { Boss } from '../entities/Boss';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Missile } from '../entities/Missile';
import { Pickup } from '../entities/Pickup';
import { Player } from '../entities/Player';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputSystem } from '../systems/InputSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { Hud } from '../ui/Hud';
import type { EnemyKind, GameOutcome, PickupKind, ResultStats } from '../types/game';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private score!: ScoreSystem;
  private spawnSystem!: SpawnSystem;
  private collisionSystem!: CollisionSystem;
  private soundSystem!: SoundSystem;
  private hud!: Hud;
  private background!: Phaser.GameObjects.TileSprite;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private playerMissiles!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private missiles!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private boss?: Boss;
  private startedAt = 0;
  private pausedAt = 0;
  private pausedMs = 0;
  private ended = false;
  private pauseLayer?: Phaser.GameObjects.Container;
  private skillButton?: Phaser.GameObjects.Container;
  private difficulty: 'normal' | 'hard' = 'normal';

  constructor() {
    super('GameScene');
  }

  create(data?: { difficulty?: 'normal' | 'hard' }): void {
    this.ended = false;
    this.pausedAt = 0;
    this.pausedMs = 0;
    this.time.paused = false;
    this.difficulty = data?.difficulty === 'hard' ? 'hard' : 'normal';
    this.game.canvas.focus();
    this.startedAt = this.time.now;
    this.soundSystem = new SoundSystem(this);
    this.soundSystem.unlock();
    this.soundSystem.startMusic('stage');
    this.score = new ScoreSystem();
    this.background = this.add.tileSprite(360, 640, 720, 1280, 'background_stage01_canyon');
    this.add.rectangle(360, 640, 720, 1280, 0x06101e, 0.18).setDepth(1);
    this.player = new Player(this, 360, 1090);
    if (this.difficulty === 'hard') {
      this.player.hp = Math.max(2, this.player.hp - 1);
      this.player.weaponLevel = 2;
    }
    this.add.image(this.player.x, this.player.y, 'fx_sheet', 'fx_player_shield').setName('player_shield').setDepth(29).setDisplaySize(118, 118).setVisible(false);
    this.inputSystem = new InputSystem(this);
    this.createGroups();
    this.hud = new Hud(this);
    this.spawnSystem = new SpawnSystem(stage01, (kind, x) => this.spawnEnemy(kind, x), (kind, x, y) => this.spawnPickup(kind, x, y), () => this.spawnBoss());
    this.collisionSystem = new CollisionSystem(
      this,
      this.player,
      this.playerBullets,
      this.playerMissiles,
      this.enemyBullets,
      this.enemies,
      this.missiles,
      this.pickups,
      this.score,
      (x, y, big) => this.explode(x, y, big),
      () => this.finish('defeat')
    );
    this.collisionSystem.bind();
    this.registerEvents();
    this.createTouchControls();
    this.time.delayedCall(5200, () => this.hud.hideMission());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  update(time: number, delta: number): void {
    if (this.ended) return;
    const input = this.inputSystem.read();
    if (input.pausePressed) {
      this.togglePause();
      return;
    }
    if (this.physics.world.isPaused) return;
    this.background.tilePositionY -= 1.9 * (delta / 16.67);
    if (input.skillPressed && this.player.activateSkill(time)) {
      this.activateSkillFeedback();
    }
    const fired = this.player.updatePlayer(time, delta, input, this.playerBullets);
    if (fired && Math.floor(time / 120) % 2 === 0) this.soundSystem.play('playerFire');
    this.tryFirePlayerMissile(time);
    const elapsed = this.getElapsedMs(time);
    this.spawnSystem.update(elapsed, this);
    this.enemies.children.each((child) => {
      (child as Enemy).updateEnemy(time, this.enemyBullets, this.missiles, this.player);
      return true;
    });
    this.boss?.updateBoss(time, this.enemyBullets, this.missiles, this.player, (x) => this.spawnEnemy('interceptor_drone', x));
    this.collisionSystem.update();
    this.updateDebugSnapshot(time);
    this.hud.update(this.player, this.score, time, this.boss);
    this.skillButton?.setAlpha(time >= this.player.skillReadyAt ? 0.95 : 0.48);
    if (!this.boss?.active && elapsed >= stage01.endTimeMs) this.finish('victory');
  }

  private createGroups(): void {
    this.playerBullets = this.physics.add.group({ classType: Bullet, maxSize: WeaponSystem.playerBulletPoolSize, runChildUpdate: true });
    this.playerMissiles = this.physics.add.group({ classType: Missile, maxSize: WeaponSystem.playerMissilePoolSize, runChildUpdate: true });
    this.enemyBullets = this.physics.add.group({ classType: Bullet, maxSize: WeaponSystem.enemyBulletPoolSize, runChildUpdate: true });
    this.enemies = this.physics.add.group({ classType: Enemy, maxSize: WeaponSystem.enemyPoolSize, runChildUpdate: false });
    this.missiles = this.physics.add.group({ classType: Missile, maxSize: WeaponSystem.missilePoolSize, runChildUpdate: true });
    this.pickups = this.physics.add.group({ classType: Pickup, maxSize: 20, runChildUpdate: true });
  }

  private spawnEnemy(kind: EnemyKind, x: number): void {
    if (this.ended || this.boss?.active && kind !== 'interceptor_drone') return;
    if (this.enemies.countActive(true) >= WeaponSystem.activeEnemyLimit) return;
    const enemy = this.enemies.get(x, -70) as Enemy | null;
    if (!enemy) return;
    enemy.spawn(kind, x, -70, this.player, this.difficulty === 'hard' ? 1.22 : 1);
    this.score.registerSpawn();
    if (this.difficulty === 'hard' && Phaser.Math.Between(0, 100) < 16 && this.enemies.countActive(true) < WeaponSystem.activeEnemyLimit) {
      const escort = this.enemies.get(Phaser.Math.Clamp(720 - x, 70, 650), -105) as Enemy | null;
      escort?.spawn('interceptor_drone', Phaser.Math.Clamp(720 - x, 70, 650), -105, this.player, 1.12);
      if (escort) this.score.registerSpawn();
    }
  }

  private spawnPickup(kind: PickupKind, x: number, y = -40): void {
    const pickup = this.pickups.get(x, y) as Pickup | null;
    pickup?.drop(kind, x, y);
  }

  private spawnBoss(): void {
    this.boss = new Boss(this, 360, -120);
    this.hud.showAlert('移动指挥车队接近', '#ff6b6b');
    this.soundSystem.stopMusic();
    this.soundSystem.startMusic('boss');
    this.soundSystem.play('boss');
    this.collisionSystem.bindBoss(this.boss, () => this.finish('victory'));
  }

  private registerEvents(): void {
    this.events.on('enemy-fire', () => this.soundSystem.play('enemyFire'));
    this.events.on('enemy-lock', (x: number, y: number) => {
      this.soundSystem.play('warning');
      this.showMissileWarning(x, y);
    });
    this.events.on('enemy-missile', (kind?: EnemyKind) => {
      this.soundSystem.play(kind === 'sam_launcher' ? 'enemySam' : 'missile');
      this.time.delayedCall(180, () => this.soundSystem.play('warning'));
    });
    this.events.on('player-hit', () => this.soundSystem.play('hit'));
    this.events.on('player-shield', () => this.soundSystem.play('shield'));
    this.events.on('pickup', () => this.soundSystem.play('pickup'));
    this.events.on('boss-phase', () => this.soundSystem.play('boss'));
    this.events.on('weapon-upgraded', (level: number) => {
      this.hud.showAlert(`武器升级 Lv${level}`, '#8ff3ff');
    });
    this.events.on('missile-reloaded', (ammo: number) => {
      this.hud.showAlert(`导弹补给 ${ammo} 发`, '#9cf7ff');
    });
    this.events.on('drop-pickup', (x: number, y: number) => {
      const kind = Phaser.Math.RND.pick<PickupKind>(['power', 'missile', 'repair', 'shield', 'multiplier']);
      this.spawnPickup(kind, x, y);
    });
  }

  private createTouchControls(): void {
    const pause = this.add.text(650, 86, 'II', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#eaf8ff',
      backgroundColor: '#25324a',
      padding: { x: 17, y: 12 }
    }).setOrigin(0.5).setDepth(120).setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => this.togglePause());

    const ring = this.add.circle(632, 1122, 52, 0x79eaff, 0.12).setStrokeStyle(3, 0x87f1ff, 0.9);
    const label = this.add.text(632, 1122, '盾', { fontFamily: 'Arial', fontSize: '28px', color: '#eafaff', fontStyle: 'bold' }).setOrigin(0.5);
    this.skillButton = this.add.container(0, 0, [ring, label]).setDepth(120).setSize(104, 104).setInteractive(
      new Phaser.Geom.Circle(632, 1122, 52),
      Phaser.Geom.Circle.Contains
    );
    this.skillButton.on('pointerdown', () => {
      if (this.physics.world.isPaused) return;
      if (this.player.activateSkill(this.time.now)) this.activateSkillFeedback();
    });
  }

  private activateSkillFeedback(): void {
    this.clearEnemyProjectiles();
    this.soundSystem.play('emp');
    this.cameras.main.flash(180, 110, 230, 255, false);
  }

  private tryFirePlayerMissile(time: number): void {
    if (this.player.missileAmmo <= 0 || time < this.player.nextMissileAt) return;
    const target = this.findPlayerMissileTarget();
    if (!target) return;
    const missile = this.playerMissiles.get(this.player.x, this.player.y - 52, 'missile_units_sheet', 'missile_player_homing') as Missile | null;
    if (!missile) return;
    this.player.missileAmmo -= 1;
    this.player.nextMissileAt = time + weapons.playerMissile.fireIntervalMs;
    missile.launchPlayer(this.player.x, this.player.y - 52, target);
    this.soundSystem.play('playerMissile');
  }

  private findPlayerMissileTarget(): Enemy | Boss | undefined {
    if (this.boss?.active) return this.boss;
    const enemies = (this.enemies.getChildren() as Enemy[]).filter((enemy) => enemy.active && enemy.y > -20 && enemy.y < this.player.y - 40);
    const priority: Record<EnemyKind, number> = {
      sam_launcher: 6,
      missile_truck: 5,
      aa_cannon: 4,
      light_fighter: 3,
      radar_station: 2,
      interceptor_drone: 1,
      patrol_drone: 0
    };
    enemies.sort((a, b) => {
      const p = priority[b.kind] - priority[a.kind];
      if (p !== 0) return p;
      return Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
    });
    return enemies[0];
  }

  private showMissileWarning(x: number, y: number): void {
    const warning = this.add.image(x, y, 'missile_fx_sheet', 'fx_missile_lock_reticle')
      .setDepth(80)
      .setDisplaySize(72, 72)
      .setAlpha(0.95);
    const smoke = this.add.image(x, y + 28, 'missile_fx_sheet', 'fx_sam_launch_smoke')
      .setDepth(12)
      .setDisplaySize(82, 54)
      .setAlpha(0.55);
    this.tweens.add({ targets: warning, alpha: 0.2, yoyo: true, repeat: 3, duration: 140, onComplete: () => warning.destroy() });
    this.tweens.add({ targets: smoke, alpha: 0, scale: 1.35, duration: 700, onComplete: () => smoke.destroy() });
  }

  private clearEnemyProjectiles(): void {
    this.enemyBullets.children.each((child) => {
      (child as Bullet).disableBody(true, true);
      return true;
    });
    this.missiles.children.each((child) => {
      (child as Missile).disableBody(true, true);
      return true;
    });
    this.playerMissiles.children.each((child) => {
      (child as Missile).disableBody(true, true);
      return true;
    });
  }

  private explode(x: number, y: number, big = false): void {
    this.soundSystem.play(big ? 'explosionBig' : 'explosionSmall');
    const key = big ? 'fx_explosion_large' : 'fx_explosion_medium';
    const blast = this.add.image(x, y, 'fx_sheet', key)
      .setDepth(40)
      .setAlpha(0.92)
      .setDisplaySize(big ? 132 : 72, big ? 132 : 72);
    this.tweens.add({
      targets: blast,
      alpha: 0,
      scale: big ? 1.45 : 1.25,
      duration: big ? 360 : 240,
      ease: 'Quad.easeOut',
      onComplete: () => blast.destroy()
    });
  }

  private togglePause(): void {
    const paused = this.physics.world.isPaused;
    if (paused) {
      this.time.paused = false;
      if (this.pausedAt > 0) {
        this.pausedMs += Math.max(0, this.time.now - this.pausedAt);
        this.pausedAt = 0;
      }
      this.physics.resume();
      this.pauseLayer?.destroy();
      this.pauseLayer = undefined;
      return;
    }
    this.pausedAt = this.time.now;
    this.time.paused = true;
    this.physics.pause();
    const shade = this.add.rectangle(360, 640, 720, 1280, 0x02050a, 0.68);
    const text = this.add.text(360, 560, '已暂停', { fontFamily: 'Arial', fontSize: '52px', color: '#e8f8ff', fontStyle: 'bold' }).setOrigin(0.5);
    const resume = this.add.text(360, 680, '继续', { fontFamily: 'Arial', fontSize: '34px', color: '#07101f', backgroundColor: '#8cecff', padding: { x: 42, y: 16 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const restart = this.add.text(360, 778, '重开', { fontFamily: 'Arial', fontSize: '30px', color: '#e8f4ff', backgroundColor: '#25324a', padding: { x: 40, y: 14 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => this.togglePause());
    restart.on('pointerdown', () => this.scene.restart());
    this.pauseLayer = this.add.container(0, 0, [shade, text, resume, restart]).setDepth(200);
  }

  private finish(outcome: GameOutcome): void {
    if (this.ended) return;
    this.ended = true;
    this.time.paused = false;
    this.soundSystem.stopMusic();
    this.physics.pause();
    const elapsedMs = this.getElapsedMs();
    const rating = outcome === 'victory' ? this.score.rating(this.player.hp, elapsedMs) : 'C';
    const previousBest = Number(localStorage.getItem('gulf-fireline-best') ?? 0);
    const bestScore = Math.max(previousBest, this.score.score);
    localStorage.setItem('gulf-fireline-best', String(bestScore));
    const stats: ResultStats = {
      outcome,
      mode: this.difficulty === 'hard' ? 'stage01_hard' : 'stage01',
      modeName: this.difficulty === 'hard' ? `${stage01.displayName} 高压` : stage01.displayName,
      retryScene: 'GameScene',
      retryData: { difficulty: this.difficulty },
      score: this.score.score,
      bestScore,
      kills: this.score.kills,
      spawned: this.score.spawned,
      hitCount: this.score.hitCount,
      maxCombo: this.score.maxCombo,
      lives: Math.max(0, this.player.hp),
      elapsedMs,
      rating
    };
    this.time.delayedCall(600, () => this.scene.start('ResultScene', stats));
  }

  private getElapsedMs(time = this.time.now): number {
    const activePauseMs = this.pausedAt > 0 ? Math.max(0, time - this.pausedAt) : 0;
    return Math.max(0, time - this.startedAt - this.pausedMs - activePauseMs);
  }

  private shutdown(): void {
    this.time.paused = false;
    this.soundSystem?.destroy();
    this.events.removeAllListeners('enemy-fire');
    this.events.removeAllListeners('enemy-lock');
    this.events.removeAllListeners('enemy-missile');
    this.events.removeAllListeners('player-hit');
    this.events.removeAllListeners('player-shield');
    this.events.removeAllListeners('pickup');
    this.events.removeAllListeners('boss-phase');
    this.events.removeAllListeners('weapon-upgraded');
    this.events.removeAllListeners('missile-reloaded');
    this.events.removeAllListeners('drop-pickup');
  }

  private updateDebugSnapshot(time: number): void {
    window.__gulfFirelineDebug = {
      time,
      combo: this.score.combo,
      score: this.score.score,
      enemies: this.enemies.countActive(true),
      playerBullets: this.playerBullets.countActive(true),
      playerMissiles: this.playerMissiles.countActive(true),
      enemyBullets: this.enemyBullets.countActive(true),
      missiles: this.missiles.countActive(true),
      pickups: this.pickups.countActive(true)
    };
  }
}

declare global {
  interface Window {
    __gulfFirelineDebug?: {
      time: number;
      combo: number;
      score: number;
      enemies: number;
      playerBullets: number;
      playerMissiles: number;
      enemyBullets: number;
      missiles: number;
      pickups: number;
    };
  }
}
