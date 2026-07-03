import Phaser from 'phaser';
import type { PickupKind } from '../types/game';

export class Pickup extends Phaser.Physics.Arcade.Image {
  kind: PickupKind = 'power';

  drop(kind: PickupKind, x: number, y: number): void {
    this.kind = kind;
    if (kind === 'missile') {
      this.setTexture('missile_fx_sheet', 'pickup_missile');
    } else {
      this.setTexture('fx_sheet', `pickup_${kind}`);
    }
    this.setDisplaySize(54, 54);
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(27);
    body.setOffset((this.width - 54) / 2, (this.height - 54) / 2);
    this.setVelocity(0, 110);
    this.setAngularVelocity(90);
    this.setDepth(17);
  }

  update(): void {
    if (this.y > 1340) this.disableBody(true, true);
  }
}
