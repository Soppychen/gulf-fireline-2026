export type FactionId = 'usaf' | 'israel' | 'iran';

export type EnemyKind = 'patrol_drone' | 'interceptor_drone' | 'light_fighter' | 'aa_cannon' | 'missile_truck' | 'sam_launcher' | 'radar_station';

export type PickupKind = 'power' | 'missile' | 'repair' | 'shield' | 'multiplier';

export type GameOutcome = 'victory' | 'defeat';

export type GameMode = 'stage01' | 'stage01_hard' | 'hell10';

export interface ResultStats {
  outcome: GameOutcome;
  mode?: GameMode;
  modeName?: string;
  retryScene?: string;
  retryData?: Record<string, unknown>;
  score: number;
  bestScore: number;
  kills: number;
  spawned: number;
  hitCount: number;
  maxCombo: number;
  lives: number;
  elapsedMs: number;
  rating: 'C' | 'B' | 'A' | 'S';
}
