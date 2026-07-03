import Phaser from 'phaser';
import { playArea } from '../data/playArea';
import type { LevelConfig, SpawnEvent } from '../data/levels';
import type { EnemyKind, PickupKind } from '../types/game';

export class SpawnSystem {
  private spawnCursor = 0;
  private pickupCursor = 0;
  private bossSpawned = false;

  constructor(
    private readonly level: LevelConfig,
    private readonly spawnEnemy: (kind: EnemyKind, x: number) => void,
    private readonly spawnPickup: (kind: PickupKind, x: number, y?: number) => void,
    private readonly spawnBoss: () => void
  ) {}

  update(elapsedMs: number, scene: Phaser.Scene): void {
    while (this.spawnCursor < this.level.spawns.length && elapsedMs >= this.level.spawns[this.spawnCursor].timeMs) {
      this.scheduleSpawn(scene, this.level.spawns[this.spawnCursor]);
      this.spawnCursor += 1;
    }
    while (this.pickupCursor < this.level.pickups.length && elapsedMs >= this.level.pickups[this.pickupCursor].timeMs) {
      const event = this.level.pickups[this.pickupCursor];
      this.spawnPickup(event.kind, event.x, -36);
      this.pickupCursor += 1;
    }
    if (!this.bossSpawned && elapsedMs >= this.level.bossTimeMs) {
      this.bossSpawned = true;
      this.spawnBoss();
    }
  }

  private scheduleSpawn(scene: Phaser.Scene, event: SpawnEvent): void {
    const count = event.count ?? 1;
    const gap = event.gapMs ?? 0;
    for (let i = 0; i < count; i += 1) {
      scene.time.delayedCall(i * gap, () => {
        const spread = count > 1 ? (i - (count - 1) / 2) * 46 : 0;
        this.spawnEnemy(event.kind, Phaser.Math.Clamp(event.x + spread, playArea.left + 26, playArea.right - 26));
      });
    }
  }
}
