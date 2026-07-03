import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Image {
  damage = 1;
  owner: 'player' | 'enemy' = 'player';

  fire(x: number, y: number, velocityX: number, velocityY: number, owner: 'player' | 'enemy', damage = 1): void {
    this.owner = owner;
    this.damage = damage;
    this.setDisplaySize(owner === 'player' ? 12 : 16, owner === 'player' ? 28 : 16);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(owner === 'player' ? 12 : 16, owner === 'player' ? 28 : 16, true);
    body.setOffset((this.width - body.width) / 2, (this.height - body.height) / 2);
    this.setVelocity(velocityX, velocityY);
    this.setActive(true).setVisible(true);
    this.setDepth(owner === 'player' ? 20 : 18);
  }

  update(): void {
    if (this.y < -80 || this.y > 1360 || this.x < -80 || this.x > 800) {
      this.disableBody(true, true);
    }
  }
}
