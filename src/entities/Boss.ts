import Phaser from 'phaser';
import type { Bullet } from './Bullet';
import type { Missile } from './Missile';
import type { Player } from './Player';

export class Boss extends Phaser.GameObjects.Container {
  hp = 420;
  maxHp = 420;
  private nextFireAt = 0;
  private nextSummonAt = 0;
  private phase = 1;
  private bodyRect!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(14);
    this.buildVisuals();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(250, 122);
    body.setOffset(-125, -61);
    body.setVelocity(0, 58);
  }

  updateBoss(time: number, bullets: Phaser.Physics.Arcade.Group, missiles: Phaser.Physics.Arcade.Group, player: Player, summon: (x: number) => void): void {
    if (!this.active) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.y > 280) body.setVelocity(Math.sin(time / 900) * 55, 0);
    this.x = Phaser.Math.Clamp(this.x, 160, 560);
    const newPhase = this.hp < this.maxHp * 0.36 ? 3 : this.hp < this.maxHp * 0.68 ? 2 : 1;
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.scene.events.emit('boss-phase');
      this.scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, repeat: 4, duration: 80 });
    }
    if (time >= this.nextFireAt) {
      this.fire(bullets, missiles, player);
      this.nextFireAt = time + (this.phase === 1 ? 720 : this.phase === 2 ? 520 : 390);
    }
    if (this.phase === 3 && time >= this.nextSummonAt) {
      summon(this.x + Phaser.Math.RND.pick([-130, 130]));
      this.nextSummonAt = time + 1700;
    }
  }

  damage(amount: number): boolean {
    this.hp -= amount;
    this.bodyRect.setFillStyle(this.phase === 3 ? 0x7fdbff : 0x5a7658);
    this.scene.time.delayedCall(50, () => this.bodyRect.setFillStyle(0x4d6249));
    return this.hp <= 0;
  }

  private fire(bullets: Phaser.Physics.Arcade.Group, missiles: Phaser.Physics.Arcade.Group, player: Player): void {
    if (this.phase === 3 && Phaser.Math.Between(0, 1) === 0) {
      const missile = missiles.get(this.x, this.y + 76, 'units_sheet', 'missile_enemy_tracking') as Missile | null;
      missile?.launchEnemy(this.x, this.y + 76, player, 'missile_enemy_tracking');
      this.scene.events.emit('enemy-missile');
      return;
    }
    const spread = this.phase === 1 ? [-0.3, 0, 0.3] : this.phase === 2 ? [-0.56, -0.28, 0, 0.28, 0.56] : [-0.68, -0.42, -0.18, 0.18, 0.42, 0.68];
    spread.forEach((angle) => {
      const bullet = bullets.get(this.x, this.y + 70, 'fx_sheet', 'bullet_enemy_red') as Bullet | null;
      const speed = this.phase === 3 ? 330 : 280;
      bullet?.fire(this.x, this.y + 70, Math.sin(angle) * speed, Math.cos(angle) * speed, 'enemy', 1);
    });
    this.scene.events.emit('enemy-fire');
  }

  private buildVisuals(): void {
    const shadow = this.scene.add.rectangle(0, 18, 270, 110, 0x000000, 0.32).setOrigin(0.5);
    this.bodyRect = this.scene.add.rectangle(0, 0, 250, 118, 0x4d6249, 0.16).setStrokeStyle(3, 0xf2d28a, 0.55);
    const comm = this.scene.add.image(0, -20, 'units_sheet', 'boss_command_car').setDisplaySize(98, 78);
    const leftAa = this.scene.add.image(-90, 18, 'units_sheet', 'boss_aa_car').setDisplaySize(82, 66);
    const rightAa = this.scene.add.image(90, 18, 'units_sheet', 'boss_aa_car').setDisplaySize(82, 66).setFlipX(true);
    const guardA = this.scene.add.image(-34, 48, 'units_sheet', 'boss_guard_car').setDisplaySize(76, 54);
    const guardB = this.scene.add.image(34, 48, 'units_sheet', 'boss_guard_car').setDisplaySize(76, 54).setFlipX(true);
    this.add([shadow, this.bodyRect, comm, leftAa, rightAa, guardA, guardB]);
  }
}
