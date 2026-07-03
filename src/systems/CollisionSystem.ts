import Phaser from 'phaser';
import { Boss } from '../entities/Boss';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Missile } from '../entities/Missile';
import { Pickup } from '../entities/Pickup';
import { Player } from '../entities/Player';
import { ScoreSystem } from './ScoreSystem';

export class CollisionSystem {
  private boss?: Boss;
  private onBossKilled?: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly playerBullets: Phaser.Physics.Arcade.Group,
    private readonly playerMissiles: Phaser.Physics.Arcade.Group,
    private readonly enemyBullets: Phaser.Physics.Arcade.Group,
    private readonly enemies: Phaser.Physics.Arcade.Group,
    private readonly missiles: Phaser.Physics.Arcade.Group,
    private readonly pickups: Phaser.Physics.Arcade.Group,
    private readonly score: ScoreSystem,
    private readonly onExplosion: (x: number, y: number, big?: boolean) => void,
    private readonly onDefeat: () => void
  ) {}

  bind(): void {
    this.scene.physics.add.overlap(this.player, this.enemyBullets, (_player, bullet) => this.hitPlayer(bullet as Bullet));
    this.scene.physics.add.overlap(this.player, this.missiles, (_player, missile) => this.hitPlayer(missile as Missile));
    this.scene.physics.add.overlap(this.player, this.enemies, (_player, enemy) => {
      if ((enemy as Enemy).active) this.hitPlayer(enemy as Enemy);
    });
    this.scene.physics.add.overlap(this.player, this.pickups, (_player, pickup) => this.takePickup(pickup as Pickup));
  }

  bindBoss(boss: Boss, onBossKilled: () => void): void {
    this.boss = boss;
    this.onBossKilled = onBossKilled;
  }

  update(): void {
    this.checkPlayerBulletsAgainstEnemies();
    this.checkPlayerBulletsAgainstBoss();
    this.checkPlayerMissilesAgainstEnemies();
    this.checkPlayerMissilesAgainstBoss();
    this.checkPlayerAgainstPickups();
  }

  private hitEnemy(projectile: Bullet | Missile, enemy: Enemy): void {
    if (!projectile.active || !enemy.active) return;
    projectile.disableBody(true, true);
    if (enemy.damage(projectile.damage)) {
      const x = enemy.x;
      const y = enemy.y;
      const value = enemy.scoreValue;
      enemy.disableBody(true, true);
      this.score.registerKill(value, this.scene.time.now);
      this.onExplosion(x, y, value > 300);
      if (Phaser.Math.Between(0, 100) < 12) {
        this.scene.events.emit('drop-pickup', x, y);
      }
    }
  }

  private hitBoss(projectile: Bullet | Missile, boss: Boss): void {
    if (!projectile.active || !boss.active) return;
    projectile.disableBody(true, true);
    if (boss.damage(projectile.damage)) {
      boss.destroy();
      this.onExplosion(boss.x, boss.y, true);
      this.score.registerKill(2500, this.scene.time.now);
      this.onBossKilled?.();
    }
  }

  private checkPlayerBulletsAgainstEnemies(): void {
    const bullets = this.playerBullets.getChildren() as Bullet[];
    const enemies = this.enemies.getChildren() as Enemy[];
    for (const bullet of bullets) {
      if (!bullet.active || bullet.owner !== 'player') continue;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const radius = Math.max(enemy.displayWidth, enemy.displayHeight) * 0.42;
        const hitRadius = radius + 12;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        if (Math.abs(dy) > hitRadius + 36 || Math.abs(dx) > hitRadius + 36) continue;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          this.hitEnemy(bullet, enemy);
          break;
        }
      }
    }
  }

  private checkPlayerBulletsAgainstBoss(): void {
    const boss = this.boss;
    if (!boss?.active) return;
    const bossBounds = new Phaser.Geom.Rectangle(boss.x - 140, boss.y - 78, 280, 156);
    const bullets = this.playerBullets.getChildren() as Bullet[];
    for (const bullet of bullets) {
      if (!bullet.active || bullet.owner !== 'player') continue;
      if (Phaser.Geom.Rectangle.Contains(bossBounds, bullet.x, bullet.y)) {
        this.hitBoss(bullet, boss);
      }
    }
  }

  private checkPlayerMissilesAgainstEnemies(): void {
    const missiles = this.playerMissiles.getChildren() as Missile[];
    const enemies = this.enemies.getChildren() as Enemy[];
    for (const missile of missiles) {
      if (!missile.active || missile.owner !== 'player') continue;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const radius = Math.max(enemy.displayWidth, enemy.displayHeight) * 0.52;
        const dx = missile.x - enemy.x;
        const dy = missile.y - enemy.y;
        if (dx * dx + dy * dy <= radius * radius) {
          this.hitEnemy(missile, enemy);
          this.scene.events.emit('player-missile-impact', missile.x, missile.y);
          break;
        }
      }
    }
  }

  private checkPlayerMissilesAgainstBoss(): void {
    const boss = this.boss;
    if (!boss?.active) return;
    const bossBounds = new Phaser.Geom.Rectangle(boss.x - 152, boss.y - 86, 304, 172);
    const missiles = this.playerMissiles.getChildren() as Missile[];
    for (const missile of missiles) {
      if (!missile.active || missile.owner !== 'player') continue;
      if (Phaser.Geom.Rectangle.Contains(bossBounds, missile.x, missile.y)) {
        this.hitBoss(missile, boss);
        this.scene.events.emit('player-missile-impact', missile.x, missile.y);
      }
    }
  }

  private hitPlayer(source: Bullet | Missile | Enemy): void {
    if (!source.active) return;
    if (source instanceof Missile && source.owner !== 'enemy') return;
    if ('disableBody' in source) source.disableBody(true, true);
    const wasHit = this.player.takeHit(this.scene.time.now);
    if (!wasHit) {
      this.scene.events.emit('player-shield');
      return;
    }
    this.score.registerHit();
    this.scene.events.emit('player-hit');
    this.scene.cameras.main.shake(130, 0.004);
    if (this.player.hp <= 0) this.onDefeat();
  }

  private takePickup(pickup: Pickup): void {
    if (!pickup.active) return;
    pickup.disableBody(true, true);
    this.player.applyPickup(pickup.kind, this.scene.time.now);
    if (pickup.kind === 'multiplier') this.score.activateMultiplier(this.scene.time.now);
    this.scene.events.emit('pickup');
  }

  private checkPlayerAgainstPickups(): void {
    const pickups = this.pickups.getChildren() as Pickup[];
    for (const pickup of pickups) {
      if (!pickup.active) continue;
      const pickupRadius = Math.max(pickup.displayWidth, pickup.displayHeight) * 0.48;
      const playerRadius = Math.max(this.player.displayWidth, this.player.displayHeight) * 0.3;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y) <= pickupRadius + playerRadius) {
        this.takePickup(pickup);
      }
    }
  }
}
