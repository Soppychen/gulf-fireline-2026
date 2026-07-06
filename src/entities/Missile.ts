import Phaser from 'phaser';
import { weapons } from '../data/weapons';
import { Boss } from './Boss';
import { Enemy } from './Enemy';
import { Player } from './Player';

export class Missile extends Phaser.Physics.Arcade.Image {
  private target?: Player | Enemy | Boss;
  private bornAt = 0;
  owner: 'player' | 'enemy' = 'enemy';
  damage = 1;

  launchEnemy(x: number, y: number, target: Player, texture = 'missile_enemy_sam'): void {
    this.owner = 'enemy';
    this.target = target;
    this.bornAt = this.scene.time.now;
    this.damage = 1;
    this.setTexture(texture === 'missile_enemy_sam' ? 'missile_units_sheet' : 'units_sheet', texture);
    this.setDisplaySize(26, 54);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 44, true);
    body.setOffset((this.width - body.width) / 2, (this.height - body.height) / 2);
    this.setVelocity(0, 150);
    this.setDepth(19);
    this.setRotation(Math.PI);
  }

  launchPlayer(x: number, y: number, target: Enemy | Boss): void {
    this.owner = 'player';
    this.target = target;
    this.bornAt = this.scene.time.now;
    this.damage = weapons.playerMissile.damage;
    this.setTexture('missile_units_sheet', 'missile_player_homing');
    this.setDisplaySize(24, 52);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 42, true);
    body.setOffset((this.width - body.width) / 2, (this.height - body.height) / 2);
    this.setVelocity(0, -360);
    this.setDepth(21);
    this.setRotation(0);
  }

  update(time: number, delta: number): void {
    if (!this.active || !this.target?.active) return;
    const age = time - this.bornAt;
    const fuelMs = this.owner === 'player' ? 3200 : 4600;
    if (age > fuelMs) {
      this.disableBody(true, true);
      return;
    }
    const speed = this.owner === 'player' ? 430 : age < 520 ? 170 : 315;
    const desired = new Phaser.Math.Vector2(this.target.x - this.x, this.target.y - this.y).normalize().scale(speed);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const turnRate = this.owner === 'player' ? 0.16 : 0.095;
    const turn = turnRate * delta;
    body.velocity.lerp(desired, Math.min(this.owner === 'player' ? 0.18 : 0.09, turn / 1000));
    this.rotation = body.velocity.angle() + Math.PI / 2;
    if (this.y < -120 || this.y > 1380 || this.x < -100 || this.x > 820) {
      this.disableBody(true, true);
    }
  }
}
