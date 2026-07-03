import Phaser from 'phaser';
import { enemies, type EnemyConfig } from '../data/enemies';
import type { EnemyKind } from '../types/game';
import type { Bullet } from './Bullet';
import type { Missile } from './Missile';
import type { Player } from './Player';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind = 'patrol_drone';
  hp = 1;
  scoreValue = 0;
  private config: EnemyConfig = enemies.patrol_drone;
  private nextFireAt = 0;
  private drift = 0;

  spawn(kind: EnemyKind, x: number, y: number, player: Player): void {
    this.kind = kind;
    this.config = enemies[kind];
    this.hp = this.config.hp;
    this.scoreValue = this.config.score;
    this.drift = Phaser.Math.FloatBetween(-1, 1);
    if (kind === 'sam_launcher') {
      this.setTexture('missile_units_sheet', this.config.texture);
    } else {
      this.setTexture('units_sheet', this.config.texture);
    }
    const size = this.displaySizeFor(kind);
    this.setDisplaySize(size.width, size.height);
    this.enableBody(true, x, y, true, true);
    this.setDepth(kind.includes('drone') || kind === 'light_fighter' ? 16 : 10);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(size.width * 0.78, size.height * 0.72, true);
    body.setOffset((this.width - body.width) / 2, (this.height - body.height) / 2);
    this.nextFireAt = this.scene.time.now + this.config.fireIntervalMs + Phaser.Math.Between(0, 450);
    if (kind === 'interceptor_drone') {
      const v = new Phaser.Math.Vector2(player.x - x, player.y - y).normalize().scale(this.config.speed);
      body.setVelocity(v.x, v.y);
    } else if (kind === 'light_fighter') {
      body.setVelocity(x < 360 ? 100 : -100, this.config.speed);
    } else {
      body.setVelocity(0, this.config.speed);
    }
  }

  updateEnemy(time: number, bullets: Phaser.Physics.Arcade.Group, missiles: Phaser.Physics.Arcade.Group, player: Player): void {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.kind === 'patrol_drone') body.setVelocityX(Math.sin((time + this.x * 3) / 550) * 45);
    if (this.kind === 'aa_cannon' || this.kind === 'missile_truck' || this.kind === 'sam_launcher' || this.kind === 'radar_station') {
      body.setVelocityX(Math.sin((time / 900) + this.drift) * 18);
    }
    if (this.config.fireIntervalMs > 0 && time >= this.nextFireAt) {
      this.fire(time, bullets, missiles, player);
      this.nextFireAt = time + this.config.fireIntervalMs;
    }
    if (this.y > 1380 || this.x < -120 || this.x > 840) this.disableBody(true, true);
  }

  damage(amount: number): boolean {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => this.clearTint());
    return this.hp <= 0;
  }

  private fire(time: number, bullets: Phaser.Physics.Arcade.Group, missiles: Phaser.Physics.Arcade.Group, player: Player): void {
    if (this.kind === 'missile_truck' || this.kind === 'sam_launcher') {
      this.setTexture(this.kind === 'sam_launcher' ? 'missile_units_sheet' : 'units_sheet', this.kind === 'sam_launcher' ? 'ground_sam_launcher_armed' : this.config.texture);
      this.scene.events.emit('enemy-lock', this.x, this.y, this.kind);
      this.scene.time.delayedCall(this.kind === 'sam_launcher' ? 850 : 650, () => {
        if (!this.active || !player.active) return;
        const texture = this.kind === 'sam_launcher' ? 'missile_enemy_sam' : 'missile_enemy_tracking';
        const missile = missiles.get(this.x, this.y + 28, texture === 'missile_enemy_sam' ? 'missile_units_sheet' : 'units_sheet', texture) as Missile | null;
        missile?.launchEnemy(this.x, this.y + 28, player, texture);
        this.scene.events.emit('enemy-missile', this.kind);
        if (this.kind === 'sam_launcher') {
          this.setTexture('missile_units_sheet', 'ground_sam_launcher');
        }
      });
      return;
    }
    const patterns = this.kind === 'aa_cannon' ? [-0.42, 0, 0.42] : this.kind === 'light_fighter' ? [-0.22, 0.22] : [0];
    patterns.forEach((angle) => {
      const bullet = bullets.get(this.x, this.y + 30, 'fx_sheet', 'bullet_enemy_red') as Bullet | null;
      const speed = 260;
      bullet?.fire(this.x, this.y + 30, Math.sin(angle) * speed, Math.cos(angle) * speed, 'enemy', 1);
    });
    this.scene.events.emit('enemy-fire');
  }

  private displaySizeFor(kind: EnemyKind): { width: number; height: number } {
    if (kind === 'light_fighter') return { width: 82, height: 74 };
    if (kind === 'aa_cannon') return { width: 78, height: 72 };
    if (kind === 'missile_truck') return { width: 88, height: 76 };
    if (kind === 'sam_launcher') return { width: 88, height: 78 };
    if (kind === 'radar_station') return { width: 78, height: 76 };
    return { width: 58, height: 58 };
  }
}
