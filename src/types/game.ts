export type FactionId = 'usaf' | 'israel' | 'iran';

export type EnemyKind = 'patrol_drone' | 'interceptor_drone' | 'light_fighter' | 'aa_cannon' | 'missile_truck' | 'sam_launcher' | 'radar_station';

export type PickupKind = 'power' | 'missile' | 'repair' | 'shield' | 'multiplier';

export type GameOutcome = 'victory' | 'defeat';

export interface ResultStats {
  outcome: GameOutcome;
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
