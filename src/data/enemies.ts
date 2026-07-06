import type { EnemyKind } from '../types/game';

export interface EnemyConfig {
  kind: EnemyKind;
  hp: number;
  speed: number;
  score: number;
  texture: string;
  radius: number;
  fireIntervalMs: number;
}

export const enemies: Record<EnemyKind, EnemyConfig> = {
  patrol_drone: { kind: 'patrol_drone', hp: 3, speed: 165, score: 140, texture: 'enemy_drone_patrol', radius: 22, fireIntervalMs: 1050 },
  interceptor_drone: { kind: 'interceptor_drone', hp: 3, speed: 285, score: 190, texture: 'enemy_drone_interceptor', radius: 20, fireIntervalMs: 950 },
  light_fighter: { kind: 'light_fighter', hp: 9, speed: 165, score: 380, texture: 'enemy_fighter_light', radius: 28, fireIntervalMs: 650 },
  aa_cannon: { kind: 'aa_cannon', hp: 10, speed: 95, score: 430, texture: 'ground_aa_cannon', radius: 30, fireIntervalMs: 760 },
  missile_truck: { kind: 'missile_truck', hp: 12, speed: 88, score: 560, texture: 'ground_missile_truck', radius: 34, fireIntervalMs: 1350 },
  sam_launcher: { kind: 'sam_launcher', hp: 14, speed: 78, score: 680, texture: 'ground_sam_launcher', radius: 36, fireIntervalMs: 1650 },
  radar_station: { kind: 'radar_station', hp: 7, speed: 78, score: 330, texture: 'ground_radar_station', radius: 32, fireIntervalMs: 0 }
};
