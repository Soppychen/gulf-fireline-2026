import type { EnemyKind } from '../types/game';

export interface HellEnemyWave {
  timeMs: number;
  kind: EnemyKind;
  x: number;
  count?: number;
  gapMs?: number;
}

export interface HellHazard {
  timeMs: number;
  type: 'lock_missile' | 'edge_wall' | 'cross_fan' | 'ring';
  x?: number;
  y?: number;
  side?: 'left' | 'right' | 'both';
}

export const hellChallenge = {
  id: 'hell10',
  displayName: '十秒炼狱',
  durationMs: 10000,
  waves: [
    { timeMs: 0, kind: 'patrol_drone', x: 120, count: 2, gapMs: 180 },
    { timeMs: 0, kind: 'patrol_drone', x: 600, count: 2, gapMs: 180 },
    { timeMs: 1000, kind: 'light_fighter', x: 120 },
    { timeMs: 1080, kind: 'light_fighter', x: 600 },
    { timeMs: 2500, kind: 'interceptor_drone', x: 120 },
    { timeMs: 2650, kind: 'interceptor_drone', x: 280 },
    { timeMs: 2800, kind: 'interceptor_drone', x: 460 },
    { timeMs: 2950, kind: 'interceptor_drone', x: 620 },
    { timeMs: 4000, kind: 'aa_cannon', x: 145 },
    { timeMs: 4200, kind: 'aa_cannon', x: 575 },
    { timeMs: 4520, kind: 'patrol_drone', x: 210, count: 3, gapMs: 180 },
    { timeMs: 4520, kind: 'patrol_drone', x: 510, count: 3, gapMs: 180 },
    { timeMs: 6000, kind: 'missile_truck', x: 150 },
    { timeMs: 6250, kind: 'missile_truck', x: 570 },
    { timeMs: 6700, kind: 'light_fighter', x: 210 },
    { timeMs: 6900, kind: 'light_fighter', x: 520 },
    { timeMs: 8200, kind: 'sam_launcher', x: 360 },
    { timeMs: 8450, kind: 'patrol_drone', x: 120, count: 4, gapMs: 120 },
    { timeMs: 8450, kind: 'patrol_drone', x: 600, count: 4, gapMs: 120 }
  ] satisfies HellEnemyWave[],
  hazards: [
    { timeMs: 120, type: 'lock_missile', x: 360, y: 80 },
    { timeMs: 1180, type: 'edge_wall', side: 'both' },
    { timeMs: 3200, type: 'lock_missile', x: 360, y: 100 },
    { timeMs: 5000, type: 'cross_fan', x: 360, y: 120 },
    { timeMs: 6500, type: 'lock_missile', x: 130, y: 960 },
    { timeMs: 7150, type: 'lock_missile', x: 590, y: 960 },
    { timeMs: 8400, type: 'ring', x: 360, y: 260 },
    { timeMs: 8900, type: 'lock_missile', x: 360, y: 90 }
  ] satisfies HellHazard[]
};
