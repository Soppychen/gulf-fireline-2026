import Phaser from 'phaser';
import { aircraft } from '../data/aircraft';
import { playArea } from '../data/playArea';
import { weapons } from '../data/weapons';
import type { InputState } from '../systems/InputSystem';
import type { Bullet } from './Bullet';

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = aircraft.afx35.maxHp;
  weaponLevel = 1;
  missileAmmo = 0;
  nextMissileAt = 0;
  shieldUntil = 0;
  invincibleUntil = 0;
  skillReadyAt = 0;
  private nextShotAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'units_sheet', 'aircraft_player_afx35');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(30);
    this.setDisplaySize(82, 98);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(aircraft.afx35.hitboxRadius);
    body.setOffset((this.width - aircraft.afx35.hitboxRadius * 2) / 2, (this.height - aircraft.afx35.hitboxRadius * 2) / 2);
    body.setMaxVelocity(aircraft.afx35.speed);
  }

  updatePlayer(time: number, delta: number, input: InputState, bullets: Phaser.Physics.Arcade.Group): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = input.focus ? aircraft.afx35.focusSpeed : aircraft.afx35.speed;
    if (input.pointerWorld) {
      const dx = input.pointerWorld.x - this.x;
      const dy = input.pointerWorld.y - this.y;
      body.setVelocity(Phaser.Math.Clamp(dx * 7, -speed, speed), Phaser.Math.Clamp(dy * 7, -speed, speed));
    } else {
      const len = Math.hypot(input.moveX, input.moveY) || 1;
      body.setVelocity((input.moveX / len) * speed, (input.moveY / len) * speed);
    }
    this.x = Phaser.Math.Clamp(this.x, playArea.left, playArea.right);
    this.y = Phaser.Math.Clamp(this.y, playArea.top, playArea.bottom);
    this.setAlpha(time < this.invincibleUntil && Math.floor(time / 90) % 2 === 0 ? 0.35 : 1);
    const shield = this.scene.children.getByName('player_shield') as Phaser.GameObjects.Image | null;
    shield?.setPosition(this.x, this.y).setVisible(time < this.shieldUntil);
    return this.tryFire(time, bullets);
  }

  activateSkill(time: number): boolean {
    if (time < this.skillReadyAt) return false;
    this.shieldUntil = time + 2800;
    this.invincibleUntil = time + 2800;
    this.skillReadyAt = time + aircraft.afx35.skillCooldownMs;
    return true;
  }

  takeHit(time: number): boolean {
    if (time < this.invincibleUntil || time < this.shieldUntil) return false;
    this.hp -= 1;
    this.invincibleUntil = time + 1500;
    return true;
  }

  applyPickup(kind: string, time: number): void {
    if (kind === 'power') {
      this.weaponLevel = Math.min(4, this.weaponLevel + 1);
      this.scene.events.emit('weapon-upgraded', this.weaponLevel);
    }
    if (kind === 'missile') {
      this.missileAmmo = Math.min(16, this.missileAmmo + 8);
      this.scene.events.emit('missile-reloaded', this.missileAmmo);
    }
    if (kind === 'repair') this.hp = Math.min(aircraft.afx35.maxHp, this.hp + 1);
    if (kind === 'shield') this.shieldUntil = time + 5000;
  }

  private tryFire(time: number, bullets: Phaser.Physics.Arcade.Group): boolean {
    const weapon = weapons.cannon;
    if (time < this.nextShotAt) return false;
    this.nextShotAt = time + weapon.fireIntervalMs;
    const offsets = this.weaponLevel === 1 ? [0] : this.weaponLevel === 2 ? [-18, 18] : this.weaponLevel === 3 ? [-28, 0, 28] : [-34, -12, 12, 34];
    offsets.forEach((offset) => {
      const bullet = bullets.get(this.x + offset, this.y - 42, 'fx_sheet', 'bullet_player_cannon') as Bullet | null;
      const fan = this.weaponLevel >= 4 ? offset * 2.1 : offset * 1.45;
      bullet?.fire(this.x + offset, this.y - 42, fan, -weapon.bulletSpeed, 'player', weapon.damage);
    });
    return true;
  }
}
