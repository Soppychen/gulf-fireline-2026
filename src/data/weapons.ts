export interface WeaponConfig {
  id: string;
  fireIntervalMs: number;
  bulletSpeed: number;
  damage: number;
}

export const weapons: Record<string, WeaponConfig> = {
  cannon: {
    id: 'cannon',
    fireIntervalMs: 120,
    bulletSpeed: 780,
    damage: 1
  },
  playerMissile: {
    id: 'playerMissile',
    fireIntervalMs: 850,
    bulletSpeed: 430,
    damage: 5
  }
};
