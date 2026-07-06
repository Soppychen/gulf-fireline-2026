import type { EnemyKind, PickupKind } from '../types/game';

export interface SpawnEvent {
  timeMs: number;
  kind: EnemyKind;
  x: number;
  count?: number;
  gapMs?: number;
}

export interface PickupEvent {
  timeMs: number;
  kind: PickupKind;
  x: number;
}

export interface LevelConfig {
  id: string;
  displayName: string;
  missionType: string;
  bossTimeMs: number;
  endTimeMs: number;
  spawns: SpawnEvent[];
  pickups: PickupEvent[];
}

export const stage01: LevelConfig = {
  id: 'stage01',
  displayName: '闪电攻击',
  missionType: '高价值指挥节点突袭',
  bossTimeMs: 105000,
  endTimeMs: 155000,
  spawns: [
    { timeMs: 2500, kind: 'patrol_drone', x: 180, count: 3, gapMs: 650 },
    { timeMs: 4200, kind: 'patrol_drone', x: 360, count: 2, gapMs: 520 },
    { timeMs: 7000, kind: 'patrol_drone', x: 520, count: 3, gapMs: 600 },
    { timeMs: 9800, kind: 'interceptor_drone', x: 140, count: 2, gapMs: 720 },
    { timeMs: 11200, kind: 'interceptor_drone', x: 580, count: 2, gapMs: 720 },
    { timeMs: 14000, kind: 'radar_station', x: 360 },
    { timeMs: 16000, kind: 'patrol_drone', x: 240, count: 3, gapMs: 420 },
    { timeMs: 17000, kind: 'patrol_drone', x: 500, count: 3, gapMs: 420 },
    { timeMs: 19000, kind: 'light_fighter', x: 120 },
    { timeMs: 21000, kind: 'interceptor_drone', x: 360, count: 3, gapMs: 380 },
    { timeMs: 24000, kind: 'light_fighter', x: 600 },
    { timeMs: 27500, kind: 'patrol_drone', x: 190, count: 4, gapMs: 360 },
    { timeMs: 28200, kind: 'patrol_drone', x: 530, count: 4, gapMs: 360 },
    { timeMs: 31000, kind: 'aa_cannon', x: 220 },
    { timeMs: 31800, kind: 'patrol_drone', x: 360, count: 3, gapMs: 260 },
    { timeMs: 32800, kind: 'light_fighter', x: 520 },
    { timeMs: 34200, kind: 'sam_launcher', x: 360 },
    { timeMs: 36500, kind: 'patrol_drone', x: 480, count: 4, gapMs: 420 },
    { timeMs: 38200, kind: 'interceptor_drone', x: 150, count: 4, gapMs: 360 },
    { timeMs: 39800, kind: 'interceptor_drone', x: 570, count: 4, gapMs: 360 },
    { timeMs: 45000, kind: 'missile_truck', x: 360 },
    { timeMs: 46500, kind: 'patrol_drone', x: 240, count: 5, gapMs: 300 },
    { timeMs: 47200, kind: 'patrol_drone', x: 480, count: 5, gapMs: 300 },
    { timeMs: 48200, kind: 'light_fighter', x: 600 },
    { timeMs: 52000, kind: 'interceptor_drone', x: 120, count: 3, gapMs: 520 },
    { timeMs: 53800, kind: 'patrol_drone', x: 360, count: 5, gapMs: 280 },
    { timeMs: 58500, kind: 'interceptor_drone', x: 610, count: 3, gapMs: 520 },
    { timeMs: 61000, kind: 'light_fighter', x: 180 },
    { timeMs: 62500, kind: 'light_fighter', x: 540 },
    { timeMs: 64200, kind: 'interceptor_drone', x: 360, count: 4, gapMs: 260 },
    { timeMs: 67000, kind: 'aa_cannon', x: 160 },
    { timeMs: 69000, kind: 'aa_cannon', x: 560 },
    { timeMs: 69000, kind: 'sam_launcher', x: 360 },
    { timeMs: 70500, kind: 'interceptor_drone', x: 360, count: 5, gapMs: 300 },
    { timeMs: 76000, kind: 'light_fighter', x: 360, count: 2, gapMs: 1100 },
    { timeMs: 79500, kind: 'patrol_drone', x: 190, count: 6, gapMs: 260 },
    { timeMs: 80500, kind: 'patrol_drone', x: 530, count: 6, gapMs: 260 },
    { timeMs: 87000, kind: 'missile_truck', x: 210 },
    { timeMs: 90000, kind: 'missile_truck', x: 520 },
    { timeMs: 92500, kind: 'light_fighter', x: 360, count: 3, gapMs: 760 },
    { timeMs: 94000, kind: 'sam_launcher', x: 360 },
    { timeMs: 96000, kind: 'interceptor_drone', x: 120, count: 5, gapMs: 320 },
    { timeMs: 97500, kind: 'interceptor_drone', x: 600, count: 5, gapMs: 320 },
    { timeMs: 101000, kind: 'patrol_drone', x: 160, count: 5, gapMs: 380 },
    { timeMs: 103000, kind: 'patrol_drone', x: 560, count: 5, gapMs: 380 },
    { timeMs: 108000, kind: 'aa_cannon', x: 360 },
    { timeMs: 111000, kind: 'missile_truck', x: 480 },
    { timeMs: 113500, kind: 'sam_launcher', x: 240 },
    { timeMs: 114800, kind: 'sam_launcher', x: 520 },
    { timeMs: 116000, kind: 'interceptor_drone', x: 90, count: 4, gapMs: 480 },
    { timeMs: 119000, kind: 'interceptor_drone', x: 630, count: 4, gapMs: 480 },
    { timeMs: 123000, kind: 'patrol_drone', x: 270, count: 6, gapMs: 240 },
    { timeMs: 124000, kind: 'patrol_drone', x: 450, count: 6, gapMs: 240 },
    { timeMs: 128000, kind: 'light_fighter', x: 180 },
    { timeMs: 129500, kind: 'missile_truck', x: 360 },
    { timeMs: 131500, kind: 'light_fighter', x: 540 },
    { timeMs: 134000, kind: 'interceptor_drone', x: 360, count: 7, gapMs: 260 },
    { timeMs: 138000, kind: 'missile_truck', x: 300 },
    { timeMs: 140000, kind: 'aa_cannon', x: 560 }
  ],
  pickups: [
    { timeMs: 16500, kind: 'power', x: 360 },
    { timeMs: 26500, kind: 'missile', x: 360 },
    { timeMs: 36000, kind: 'power', x: 360 },
    { timeMs: 42000, kind: 'shield', x: 250 },
    { timeMs: 72000, kind: 'repair', x: 500 },
    { timeMs: 76000, kind: 'missile', x: 360 },
    { timeMs: 82000, kind: 'power', x: 360 },
    { timeMs: 95000, kind: 'multiplier', x: 360 }
  ]
};
