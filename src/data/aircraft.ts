import type { FactionId } from '../types/game';

export interface AircraftConfig {
  id: string;
  factionId: FactionId;
  displayName: string;
  maxHp: number;
  speed: number;
  focusSpeed: number;
  hitboxRadius: number;
  weaponId: string;
  skillCooldownMs: number;
}

export const aircraft: Record<string, AircraftConfig> = {
  afx35: {
    id: 'afx35',
    factionId: 'usaf',
    displayName: 'AFX-35',
    maxHp: 3,
    speed: 430,
    focusSpeed: 230,
    hitboxRadius: 14,
    weaponId: 'cannon',
    skillCooldownMs: 10000
  }
};
