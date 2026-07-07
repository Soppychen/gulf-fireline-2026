import Phaser from 'phaser';
import { hellChallenge, type HellHazard } from '../data/hellChallenge';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Missile } from '../entities/Missile';
import { Pickup } from '../entities/Pickup';
import { Player } from '../entities/Player';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputSystem } from '../systems/InputSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { EnemyKind, GameOutcome, ResultStats } from '../types/game';

export class HellChallengeScene extends Phaser.Scene {
  private player!: Player;
  private inputSystem!: InputSystem;
  private score!: ScoreSystem;
  private collisionSystem!: CollisionSystem;
  private soundSystem!: SoundSystem;
  private background!: Phaser.GameObjects.TileSprite;
  private countdownText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private playerMissiles!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private missiles!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private survivalMs = 0;
  private ended = false;
  private pauseLayer?: Phaser.GameObjects.Container;
  private scheduledWaveIndexes = new Set<number>();
  private scheduledHazardIndexes = new Set<number>();
  private coreCleared = false;
  private nextOvertimeHazardAt = 0;
  private nextOvertimeWaveAt = 0;

  constructor() {
    super('HellChallengeScene');
  }

  create(): void {
    this.ended = false;
    this.coreCleared = false;
    this.survivalMs = 0;
    this.time.paused = false;
    this.nextOvertimeHazardAt = 0;
    this.nextOvertimeWaveAt = 0;
    this.scheduledWaveIndexes.clear();
    this.scheduledHazardIndexes.clear();
    this.game.canvas.focus();
    this.soundSystem = new SoundSystem(this);
    this.soundSystem.unlock();
    this.soundSystem.startMusic('boss');
    this.score = new ScoreSystem();
    this.background = this.add.tileSprite(360, 640, 720, 1280, 'background_stage01_facility');
    this.add.rectangle(360, 640, 720, 1280, 0x12040a, 0.32).setDepth(1);
    this.player = new Player(this, 360, 1090);
    this.player.hp = 1;
    this.player.weaponLevel = 2;
    this.player.speedMultiplier = 1.5;
    this.player.missileAmmo = 0;
    this.player.skillReadyAt = Number.POSITIVE_INFINITY;
    this.add.image(this.player.x, this.player.y, 'fx_sheet', 'fx_player_shield').setName('player_shield').setDepth(29).setDisplaySize(98, 98).setVisible(false);
    this.inputSystem = new InputSystem(this, { pointerFollowOffsetY: 118 });
    this.createGroups();
    this.createHud();
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
      () => this.finish('defeat'),
      { lethalPlayerHits: true, lethalPlayerRadius: 42 }
    );
    this.collisionSystem.bind();
    this.registerEvents();
    this.showOpeningCue();
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
    const frameMs = Math.min(delta, 50);
    this.survivalMs += frameMs;
    this.background.tilePositionY -= 2.85 * (frameMs / 16.67);
    const elapsed = this.survivalMs;
    this.player.updatePlayer(time, delta, { ...input, skillPressed: false }, this.playerBullets);
    this.updateTimeline(elapsed);
    this.enemies.children.each((child) => {
      (child as Enemy).updateEnemy(time, this.enemyBullets, this.missiles, this.player);
      return true;
    });
    this.collisionSystem.update();
    this.updateHud(elapsed);
    if (elapsed >= hellChallenge.durationMs && !this.coreCleared) this.enterOvertime();
    if (this.coreCleared) this.updateOvertime(elapsed);
  }

  private createGroups(): void {
    this.playerBullets = this.physics.add.group({ classType: Bullet, maxSize: WeaponSystem.playerBulletPoolSize, runChildUpdate: true });
    this.playerMissiles = this.physics.add.group({ classType: Missile, maxSize: 1, runChildUpdate: true });
    this.enemyBullets = this.physics.add.group({ classType: Bullet, maxSize: WeaponSystem.enemyBulletPoolSize, runChildUpdate: true });
    this.enemies = this.physics.add.group({ classType: Enemy, maxSize: WeaponSystem.enemyPoolSize, runChildUpdate: false });
    this.missiles = this.physics.add.group({ classType: Missile, maxSize: WeaponSystem.missilePoolSize, runChildUpdate: true });
    this.pickups = this.physics.add.group({ classType: Pickup, maxSize: 1, runChildUpdate: true });
  }

  private createHud(): void {
    const bestMs = Number(localStorage.getItem('gulf-fireline-hell-best-ms') ?? 0);
    this.bestText = this.add.text(34, 36, `BEST ${(bestMs / 1000).toFixed(2)}s`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffdd86'
    }).setDepth(120);
    this.countdownText = this.add.text(360, 54, '剩余 10.00', {
      fontFamily: 'Arial',
      fontSize: '46px',
      color: '#eafaff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(120);
    this.add.text(650, 48, 'II', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#eaf8ff',
      backgroundColor: '#25324a',
      padding: { x: 17, y: 12 }
    }).setOrigin(0.5).setDepth(120).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
  }

  private showOpeningCue(): void {
    const cue = this.add.text(360, 410, '坚持 10 秒', {
      fontFamily: 'Arial',
      fontSize: '58px',
      color: '#ffedf0',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(130);
    this.tweens.add({ targets: cue, alpha: 0, y: 360, delay: 450, duration: 520, onComplete: () => cue.destroy() });
  }

  private updateTimeline(elapsed: number): void {
    hellChallenge.waves.forEach((wave, index) => {
      if (elapsed < wave.timeMs || this.scheduledWaveIndexes.has(index)) return;
      this.scheduledWaveIndexes.add(index);
      const count = wave.count ?? 1;
      for (let i = 0; i < count; i += 1) {
        this.time.delayedCall(i * (wave.gapMs ?? 0), () => this.spawnEnemy(wave.kind, Phaser.Math.Clamp(wave.x + (i - (count - 1) / 2) * 42, 70, 650)));
      }
    });
    hellChallenge.hazards.forEach((hazard, index) => {
      if (elapsed < hazard.timeMs || this.scheduledHazardIndexes.has(index)) return;
      this.scheduledHazardIndexes.add(index);
      this.triggerHazard(hazard);
    });
  }

  private spawnEnemy(kind: EnemyKind, x: number): void {
    if (this.ended || this.enemies.countActive(true) >= WeaponSystem.activeEnemyLimit) return;
    const enemy = this.enemies.get(x, -70) as Enemy | null;
    if (!enemy) return;
    enemy.spawn(kind, x, -70, this.player, 1.35);
    enemy.hp = Math.max(1, Math.round(enemy.hp * 0.48));
    this.score.registerSpawn();
  }

  private triggerHazard(hazard: HellHazard): void {
    if (hazard.type === 'lock_missile') {
      this.lockMissile(hazard.x ?? this.player.x, hazard.y ?? 80);
      return;
    }
    if (hazard.type === 'edge_wall') {
      this.edgeWall(hazard.side ?? 'both');
      return;
    }
    if (hazard.type === 'cross_fan') {
      this.crossFan(hazard.x ?? 360, hazard.y ?? 100);
      return;
    }
    this.ringBurst(hazard.x ?? 360, hazard.y ?? 260);
  }

  private lockMissile(x: number, y: number): void {
    this.soundSystem.play('warning');
    const lock = this.add.image(x, y, 'missile_fx_sheet', 'fx_missile_lock_reticle').setDepth(90).setDisplaySize(94, 94);
    this.tweens.add({ targets: lock, alpha: 0.18, yoyo: true, repeat: 4, duration: 95, onComplete: () => lock.destroy() });
    this.time.delayedCall(650, () => {
      const missile = this.missiles.get(x, y, 'missile_units_sheet', 'missile_enemy_sam') as Missile | null;
      missile?.launchEnemy(x, y, this.player, 'missile_enemy_sam');
      this.soundSystem.play('enemySam');
    });
  }

  private edgeWall(side: 'left' | 'right' | 'both'): void {
    const lanes = side === 'both' ? [58, 102, 618, 662] : side === 'left' ? [58, 102] : [618, 662];
    lanes.forEach((x, laneIndex) => {
      for (let i = 0; i < 7; i += 1) {
        this.time.delayedCall(i * 120 + laneIndex * 42, () => this.fireEnemyBullet(x, -20, laneIndex < 2 ? 45 : -45, 260));
      }
    });
  }

  private crossFan(x: number, y: number): void {
    [-0.72, -0.46, -0.23, 0, 0.23, 0.46, 0.72].forEach((offset) => {
      const angle = Math.PI / 2 + offset;
      this.fireEnemyBullet(x, y, Math.cos(angle) * 350, Math.sin(angle) * 350);
    });
    this.soundSystem.play('enemyFire');
  }

  private ringBurst(x: number, y: number): void {
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      this.fireEnemyBullet(x, y, Math.cos(angle) * 240, Math.sin(angle) * 240);
    }
    this.cameras.main.flash(120, 130, 20, 25, false);
    this.soundSystem.play('warning');
  }

  private fireEnemyBullet(x: number, y: number, velocityX: number, velocityY: number): void {
    const bullet = this.enemyBullets.get(x, y, 'fx_sheet', 'bullet_enemy_red') as Bullet | null;
    bullet?.fire(x, y, velocityX, velocityY, 'enemy', 1);
  }

  private registerEvents(): void {
    this.events.on('enemy-fire', () => this.soundSystem.play('enemyFire'));
    this.events.on('enemy-lock', (x: number, y: number) => this.showMissileWarning(x, y));
    this.events.on('enemy-missile', (kind?: EnemyKind) => this.soundSystem.play(kind === 'sam_launcher' ? 'enemySam' : 'missile'));
    this.events.on('player-hit', () => this.soundSystem.play('hit'));
    this.events.on('player-shield', () => this.soundSystem.play('shield'));
    this.events.on('drop-pickup', () => undefined);
  }

  private showMissileWarning(x: number, y: number): void {
    const warning = this.add.image(x, y, 'missile_fx_sheet', 'fx_missile_lock_reticle').setDepth(80).setDisplaySize(72, 72).setAlpha(0.95);
    this.tweens.add({ targets: warning, alpha: 0.2, yoyo: true, repeat: 3, duration: 120, onComplete: () => warning.destroy() });
  }

  private updateHud(elapsed: number): void {
    const remaining = Math.max(0, hellChallenge.durationMs - elapsed);
    this.countdownText.setText(this.coreCleared ? `生存 ${(elapsed / 1000).toFixed(2)}` : `剩余 ${(remaining / 1000).toFixed(2)}`);
    this.countdownText.setColor(this.coreCleared || remaining <= 3000 ? '#ff5d6c' : '#eafaff');
    if (elapsed > 8000) {
      this.cameras.main.setBackgroundColor(Math.floor(elapsed / 140) % 2 === 0 ? '#17040a' : '#07101f');
    }
  }

  private enterOvertime(): void {
    this.coreCleared = true;
    this.enemyBullets.clear(true, true);
    this.missiles.clear(true, true);
    this.nextOvertimeHazardAt = hellChallenge.durationMs + 720;
    this.nextOvertimeWaveAt = hellChallenge.durationMs + 1200;
    this.cameras.main.flash(260, 255, 245, 220, false);
    this.soundSystem.play('ui');
    const pass = this.add.text(360, 390, '10.00s 生还', {
      fontFamily: 'Arial',
      fontSize: '52px',
      color: '#9cf7ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(130);
    this.tweens.add({ targets: pass, alpha: 0, y: 342, delay: 520, duration: 520, onComplete: () => pass.destroy() });
  }

  private updateOvertime(elapsed: number): void {
    const level = Math.floor((elapsed - hellChallenge.durationMs) / 5000) + 1;
    if (elapsed >= this.nextOvertimeHazardAt) {
      this.nextOvertimeHazardAt = elapsed + Math.max(520, 1180 - level * 90);
      const lane = Phaser.Math.RND.pick([110, 240, 360, 480, 610]);
      if (level % 3 === 0) {
        this.ringBurst(360, 250);
      } else {
        this.lockMissile(lane, Phaser.Math.Between(70, 190));
      }
    }
    if (elapsed >= this.nextOvertimeWaveAt) {
      this.nextOvertimeWaveAt = elapsed + Math.max(900, 1850 - level * 120);
      const side = Phaser.Math.Between(0, 1) === 0 ? 120 : 600;
      this.spawnEnemy('interceptor_drone', side);
      this.spawnEnemy(level % 2 === 0 ? 'light_fighter' : 'patrol_drone', 720 - side);
    }
  }

  private explode(x: number, y: number, big = false): void {
    this.soundSystem.play(big ? 'explosionBig' : 'explosionSmall');
    const blast = this.add.image(x, y, 'fx_sheet', big ? 'fx_explosion_large' : 'fx_explosion_medium')
      .setDepth(40)
      .setDisplaySize(big ? 132 : 72, big ? 132 : 72);
    this.tweens.add({ targets: blast, alpha: 0, scale: big ? 1.45 : 1.25, duration: big ? 360 : 240, onComplete: () => blast.destroy() });
  }

  private togglePause(): void {
    const paused = this.physics.world.isPaused;
    if (paused) {
      this.time.paused = false;
      this.physics.resume();
      this.pauseLayer?.destroy();
      this.pauseLayer = undefined;
      return;
    }
    this.time.paused = true;
    this.physics.pause();
    const shade = this.add.rectangle(360, 640, 720, 1280, 0x02050a, 0.72);
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
    const elapsedMs = this.survivalMs;
    const cleared = elapsedMs >= hellChallenge.durationMs;
    const resultOutcome: GameOutcome = outcome === 'victory' || cleared ? 'victory' : 'defeat';
    const previousBest = Number(localStorage.getItem('gulf-fireline-hell-best-ms') ?? 0);
    const bestMs = Math.max(previousBest, elapsedMs);
    localStorage.setItem('gulf-fireline-hell-best-ms', String(bestMs));
    if (resultOutcome === 'victory') {
      this.enemyBullets.clear(true, true);
      this.missiles.clear(true, true);
      this.cameras.main.flash(260, 255, 245, 220, false);
      this.soundSystem.play('ui');
    }
    const rating = elapsedMs >= 10000 ? 'S' : elapsedMs >= 9000 ? 'A' : elapsedMs >= 6000 ? 'B' : 'C';
    const stats: ResultStats = {
      outcome: resultOutcome,
      mode: 'hell10',
      modeName: hellChallenge.displayName,
      retryScene: 'HellChallengeScene',
      score: this.score.score + Math.round(elapsedMs),
      bestScore: bestMs,
      kills: this.score.kills,
      spawned: this.score.spawned,
      hitCount: this.score.hitCount,
      maxCombo: this.score.maxCombo,
      lives: Math.max(0, this.player.hp),
      elapsedMs,
      rating
    };
    this.time.delayedCall(resultOutcome === 'victory' ? 700 : 360, () => this.scene.start('ResultScene', stats));
  }

  private shutdown(): void {
    this.time.paused = false;
    this.soundSystem?.destroy();
    this.events.removeAllListeners('enemy-fire');
    this.events.removeAllListeners('enemy-lock');
    this.events.removeAllListeners('enemy-missile');
    this.events.removeAllListeners('player-hit');
    this.events.removeAllListeners('player-shield');
    this.events.removeAllListeners('drop-pickup');
  }
}
